const Web3 = require('web3');
const rpcURL = 'http://127.0.0.1:9545';
const web3 = new Web3(rpcURL);

const RecurringPaymentWallet = require('../build/contracts/RecurringPaymentWallet.json'); //how do we make this more robust?
const recurringPaymentsWalletAddress = '0xb39CA142159DF2aE60857113c7De2d7FB8637dC7'; //how do we get this from the deploy script?
const mnemonic = 'congress false detail border fade run purpose fantasy forum pink inside that';

const accounts = [
    '0xeBd52BE708F1ff0B3F2b4D2059b0Ec10457D74C4',
    '0x9c190d1B77384355232389Cf0952A87FdceAe88B',
    '0x165FFDfCddbbEacAa10ffe4eF70D6e1b7cbe9FFE',
    '0xC066371fBc2E4eFc07B43a429981Ad11b6f7E4Fd',
    '0x97903F954764143E74D17E2f52953Ec9D18c48dC',
    '0x51A1F94EAA818711ACa62018F904A41E572b69E5',
    '0x193f08D790791451fcFDeC9ec8a584FfC7E4484B',
    '0x3be528C61496a57dc218CFB1175fe79D3c478163',
    '0xbbe4a93B18057620d64201C2301E5200681836d7',
    '0x590E0F424e33c4450Fd8B95FfA16cC9b7dda10aF'
]
const recurringPaymentWallet = new web3.eth.Contract(RecurringPaymentWallet.abi, recurringPaymentsWalletAddress);

takeSnapshot = () => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_snapshot',
            id: new Date().getTime()
        }, (err, snapshotId) => {
            if (err) { return reject(err) }
            return resolve(snapshotId)
        })
    })
}

revertToSnapShot = (id) => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_revert',
            params: [id],
            id: new Date().getTime()
        }, (err, result) => {
            if (err) { return reject(err) }
            return resolve(result)
        })
    })
}

printSummary = async (heading) => {
    console.log('\r\n');
    console.log(`${heading}\r\n`);

    for await (const account of accounts) {
        let walletBalance = await recurringPaymentWallet.methods.getBalance().call({from : account});
        let accountBalance = await web3.eth.getBalance(account);
        console.log(`Account ${account}`); 
        console.log(`  Account balance  : ${web3.utils.fromWei(accountBalance, 'ether')} ETH`);
        console.log(`  Wallet balance   : ${web3.utils.fromWei(walletBalance, 'ether')} ETH`);
        console.log('\n');
    };

    let contractBalance = await web3.eth.getBalance(recurringPaymentWallet.options.address);
    console.log(`RecurringPaymentWallet contract balance   : ${web3.utils.fromWei(contractBalance, 'ether')} ETH`);
}

async function run() {
    //Store blockchain state
    let snapShot = await takeSnapshot();
    let snapshotId = snapShot['result'];
    let amount;

    result = await printSummary('Initial state');
    try {
        for await (const account of accounts) {
            amount = web3.utils.toWei(((Math.random() * 10) + 1).toString());
            await recurringPaymentWallet.methods.deposit().send({from : account, value : amount});
        };

        result = await printSummary('After deposit state');

        for await (const account of accounts) {
            await recurringPaymentWallet.methods.drain().send({from : account});
        };

        result = await printSummary('After drain state');
    } 
    finally {
        //restore blockchain state
        await revertToSnapShot(snapshotId);
    }
    
}

run();


