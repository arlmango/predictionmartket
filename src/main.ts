import './polyfill';
import './styles.css';
import {Connection,PublicKey} from '@solana/web3.js';
import {getAssociatedTokenAddressSync} from '@solana/spl-token';
import {DEVNET,loadOrCreateBurner,createBurnerClient,ensureFunded,getBalances} from './vendor/burner';
import {marketView,quoteBuy} from './vendor/quote';
import {parseAmount} from './input.mjs';
import config from './config.json';
const $=(id:string)=>document.getElementById(id)!;
const fmt=(v:number,dp=2)=>v.toLocaleString('ru-RU',{maximumFractionDigits:dp});
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const explorer=(sig:string)=>`https://explorer.solana.com/tx/${sig}?cluster=devnet`;
$('app').innerHTML=`<header><div class="brand"><span class="logo">↗</span>вероятно <span class="tag">Solana devnet</span></div><div class="wallet" id="wallet">Создаём тестовый кошелёк…</div></header><main><div class="intro"><p>Ваш прогноз становится сделкой.</p><button class="secondary refresh" id="refresh">Обновить данные</button></div><div class="grid"><section class="panel market"><div class="meta"><span class="live" id="market-status">Загружаем рынок</span><span>pm-AMM</span></div><h1 id="question">${esc(config.question)}</h1><div class="muted" id="deadline">Проверяем срок в devnet…</div><div class="probability"><strong id="probability">—</strong><span>вероятность YES</span></div><div class="bar"><i id="bar" style="width:50%"></i></div><div class="bar-labels"><span id="yes-label">YES</span><span id="no-label">NO</span></div><div class="rules"><strong>Правило рынка</strong><p>YES, если до закрытия рынка сделки совершат хотя бы 10 уникальных кошельков. Иначе NO. Создатель проверяет сделки в Solana и разрешает рынок вручную после срока.</p><p>Цена отражает состояние pm-AMM, а не гарантированный исход.</p><a id="market-link" target="_blank" rel="noopener">Рынок в Solana Explorer</a></div></section><section class="panel"><h2>Сделать прогноз</h2><div class="sides"><button class="side selected" data-side="yes" aria-pressed="true">YES · Да</button><button class="side" data-side="no" aria-pressed="false">NO · Нет</button></div><label for="amount">Сумма сделки</label><div class="field"><input id="amount" value="5" inputmode="decimal" autocomplete="off"><span>mUSDC</span></div><div class="amounts"><button data-amount="1">1</button><button data-amount="5">5</button><button data-amount="10">10</button></div><div class="quote-row"><span>Ожидаемая позиция</span><strong id="output">—</strong></div><div class="quote-row"><span>Минимум при сделке</span><strong id="minimum">—</strong></div><div class="quote-row"><span>Комиссия / проскальзывание</span><strong>2% / 1%</strong></div><small class="muted">Котировка ориентировочная. Минимум защищён on-chain.</small><button class="primary" id="trade" disabled>Подготавливаем кошелёк…</button><div id="status" class="status" role="status" aria-live="polite">Получаем тестовые mUSDC и SOL для комиссии.</div><button class="secondary" id="retry" hidden style="margin-top:12px">Повторить подключение</button></section></div><div class="positions"><div class="position"><span>Баланс mUSDC</span><strong id="balance">—</strong></div><div class="position"><span>Ваша позиция YES</span><strong id="position-yes">—</strong></div><div class="position"><span>Ваша позиция NO</span><strong id="position-no">—</strong></div></div><section class="panel history"><h2>Ваши сделки</h2><div id="history" class="muted">После первой сделки здесь появится подтверждение из Solana.</div></section></main><footer><span>Прототип хакатона · официальный @pm-amm/sdk</span><span>Только devnet и тестовые mUSDC. Токены не имеют денежной ценности.</span></footer>`;
const connection=new Connection(DEVNET.rpc,'confirmed');
let kp:any,client:any,market:any,marketPda:PublicKey,side:'yes'|'no'='yes',busy=true,ready=false,balance=0;
let history:any[]=[];
try{history=JSON.parse(localStorage.getItem('veroyatno-trades-v1')||'[]');if(!Array.isArray(history))history=[];}catch{}
function status(msg:string,type=''){ $('status').textContent=msg;$('status').className=`status ${type}`; }
function renderHistory(){const rows=history.filter(b=>b.wallet===kp?.publicKey.toBase58()&&b.market===config.marketId);$('history').innerHTML=rows.length?rows.map(b=>`<div class="history-row"><span>${esc(b.side.toUpperCase())} · ${fmt(b.amount)} mUSDC</span><a href="${explorer(encodeURIComponent(b.signature))}" target="_blank" rel="noopener">${b.confirmed?'Подтверждено':'Проверить статус'} ↗</a></div>`).join(''):'Сделок пока нет. Выберите YES или NO и купите позицию.';}
function updateQuote(){
 const button=$('trade') as HTMLButtonElement;button.disabled=true;
 button.textContent=busy?'Ожидаем devnet…':`Купить ${side.toUpperCase()}`;
 try{if(!market||!ready||busy)return;const raw=parseAmount(($('amount') as HTMLInputElement).value);const q=quoteBuy(market,side,raw);$('output').textContent=`≈ ${fmt(q.output/1e6,4)} ${side.toUpperCase()}`;$('minimum').textContent=`${fmt(q.minOutput/1e6,4)} ${side.toUpperCase()}`;button.disabled=raw>balance*1e6;if(button.disabled)status('Недостаточно mUSDC. Уменьшите сумму.','error');}
 catch(e){$('output').textContent='—';$('minimum').textContent='—';if(!busy&&ready)status((e as Error).message,'error');}
}
async function tokenBalance(mint:PublicKey){const ata=getAssociatedTokenAddressSync(mint,kp.publicKey);const account=await connection.getAccountInfo(ata);if(!account)return 0;return Number((await connection.getTokenAccountBalance(ata)).value.uiAmount||0);}
async function refresh(){
 const [m,b,y,n]=await Promise.all([client.fetchMarket(marketPda),getBalances(connection,kp.publicKey),tokenBalance(client.yesMint(marketPda)),tokenBalance(client.noMint(marketPda))]);
 if(!m)throw new Error('Рынок не найден в devnet.');
 if(!m.collateralMint.equals(DEVNET.usdcMint))throw new Error('Неверный collateral: разрешён только тестовый mUSDC.');
 market=m;balance=b.usdc;const v=marketView(m);const p=v.price*100;
 $('probability').textContent=`${fmt(p,1)}%`;$('bar').style.width=`${p}%`;$('yes-label').textContent=`YES ${fmt(p,1)}%`;$('no-label').textContent=`NO ${fmt(100-p,1)}%`;
 $('deadline').textContent=`Закрытие: ${new Date(v.end*1000).toLocaleString('ru-RU')}`;$('market-status').textContent=m.resolved?'Разрешён':v.end<=Date.now()/1000?'Закрыт':'● Торги открыты';
 $('balance').textContent=fmt(b.usdc);$('position-yes').textContent=fmt(y,4);$('position-no').textContent=fmt(n,4);
 $('wallet').textContent=`${kp.publicKey.toBase58().slice(0,6)}…${kp.publicKey.toBase58().slice(-4)} · ${fmt(b.sol,4)} SOL`;
 ($('market-link') as HTMLAnchorElement).href=`https://explorer.solana.com/address/${marketPda.toBase58()}?cluster=devnet`;
 updateQuote();
}
async function init(){busy=true;ready=false;($('retry') as HTMLButtonElement).hidden=true;updateQuote();
 try{kp=loadOrCreateBurner('veroyatno-devnet-wallet-v1');client=createBurnerClient(connection,kp);marketPda=client.marketPda(config.marketId);renderHistory();status('Подготавливаем тестовый кошелёк и получаем mUSDC…');const funded=await ensureFunded(connection,kp.publicKey);if(funded.fund&&!funded.fund.funded)throw new Error(`Кран временно недоступен: ${funded.fund.reason}. Повторите подключение позже.`);await refresh();ready=true;status('Кошелёк готов. Выберите исход и сумму.');}
 catch(e){status(`Не удалось подключиться: ${(e as Error).message}`,'error');($('retry') as HTMLButtonElement).hidden=false;}
 finally{busy=false;updateQuote();}
}
async function trade(){if(busy||!ready)return;busy=true;updateQuote();let signature:string|undefined;
 try{const amountRaw=parseAmount(($('amount') as HTMLInputElement).value);const selectedSide=side;status('Обновляем рынок и проверяем котировку…');await refresh();if(amountRaw>balance*1e6)throw new Error('Недостаточно тестовых mUSDC.');const q=quoteBuy(market,selectedSide,amountRaw);status('Подписываем и отправляем сделку. Ожидаем подтверждение Solana…');signature=await client.send.swap(marketPda,selectedSide==='yes'?'usdcToYes':'usdcToNo',amountRaw,q.minOutput);history.unshift({wallet:kp.publicKey.toBase58(),market:config.marketId,side:selectedSide,amount:amountRaw/1e6,signature,confirmed:true});try{localStorage.setItem('veroyatno-trades-v1',JSON.stringify(history));}catch{}renderHistory();await refresh();status(`Сделка ${selectedSide.toUpperCase()} подтверждена. Вероятность, баланс и позиция обновлены.`,'success');}
 catch(e){status(signature?`Сделка подтверждена, но обновление данных не удалось. Нажмите «Обновить данные».`:`Сделка не подтверждена: ${(e as Error).message}. Проверьте кошелёк перед повтором.`,'error');}
 finally{busy=false;updateQuote();}
}
document.querySelectorAll<HTMLButtonElement>('[data-side]').forEach(b=>b.onclick=()=>{if(busy)return;side=b.dataset.side as any;document.querySelectorAll<HTMLButtonElement>('[data-side]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});updateQuote();});
document.querySelectorAll<HTMLButtonElement>('[data-amount]').forEach(b=>b.onclick=()=>{if(busy)return;($('amount') as HTMLInputElement).value=b.dataset.amount!;updateQuote();});
$('amount').oninput=()=>updateQuote();$('trade').onclick=trade;$('retry').onclick=init;
$('refresh').onclick=async()=>{if(busy)return;if(!ready){await init();return;}busy=true;updateQuote();try{await refresh();status('Данные обновлены.');}catch(e){status((e as Error).message,'error');}finally{busy=false;updateQuote();}};
void init();
