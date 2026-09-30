const fs=require('node:fs');
const {Connection,PublicKey,Keypair}=require('@solana/web3.js');
const {AnchorProvider,Wallet}=require('@anchor-lang/core');
const {PmAmmClient}=require('@pm-amm/sdk');
async function main(){
 if(!process.env.WALLET)throw new Error('Set WALLET to an existing devnet-wallet.json outside this repository.');
 const kp=Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(process.env.WALLET,'utf8'))));
 const connection=new Connection('https://api.devnet.solana.com','confirmed');
 const client=PmAmmClient.fromProvider(new AnchorProvider(connection,new Wallet(kp),{commitment:'confirmed'}),new PublicKey('GV1FMGHRYBjQLaghE5fnGuYCuCcpdt3GD5xEX3TwN16y'),new PublicKey('3WQ8hCqTNwjrh8WzE2XyoZoUrd1miPcwWfMkmFPUMEWZ'));
 const name='Will our hackathon demo reach 10 unique traders?';
 const result=await client.send.createMarket({name,durationSecs:604800,initialPriceBps:5000,depositUsdc:100});
 fs.writeFileSync('src/config.json',JSON.stringify({marketId:result.marketId,question:name,creationSignature:result.signature},null,2)+'\n');
 console.log(JSON.stringify(result));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
