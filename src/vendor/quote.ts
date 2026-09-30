// Adapted from the official reference app's clientSideQuote helper (MIT).
// https://github.com/EwanBorgPad/pm-amm/blob/b1dbaa7ac04665d6f0c4cb1fb3aef0c704c7283d/app/src/hooks/use-swap-quote.ts
import {i80f48ToNumber,priceFromReserves,estimateSwapOutput} from '@pm-amm/sdk/math';
import {SWAP_FEE_BPS} from '@pm-amm/sdk';
export function marketView(m:any,now=Math.floor(Date.now()/1000)){
 const end=m.endTs.toNumber(),lZero=i80f48ToNumber(m.lZero);
 const lLast=lZero*Math.sqrt(Math.max(end-m.lastAccrualTs.toNumber(),1));
 const lEff=lZero*Math.sqrt(Math.max(end-now,1));
 const x=i80f48ToNumber(m.reserveYes),y=i80f48ToNumber(m.reserveNo);
 return {end,price:m.resolved?(m.winningSide===1?1:0):priceFromReserves(x,y,lLast),reserveYes:x*lEff/lLast,reserveNo:y*lEff/lLast,lEff};
}
export function quoteBuy(m:any,side:'yes'|'no',amountRaw:number){
 const s=marketView(m);
 if(m.resolved||s.end<=Date.now()/1000)throw new Error('Рынок закрыт.');
 const netIn=Math.floor(amountRaw*(10000-SWAP_FEE_BPS)/10000);
 const est=estimateSwapOutput(s.reserveYes,s.reserveNo,s.lEff,netIn,side);
 const output=Math.max(0,Math.floor(est.output));
 const minOutput=Math.floor(output*0.99);
 if(!Number.isSafeInteger(minOutput)||minOutput<=0)throw new Error('Сумма слишком мала для котировки.');
 return {output,minOutput,priceAfter:est.priceAfter};
}
