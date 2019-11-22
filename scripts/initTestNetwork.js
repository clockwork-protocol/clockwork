const Web3 = require('web3');
const rpcURL = 'http://localhost:9545';
const web3 = new Web3(rpcURL);

const RecurringPaymentWallet = require('../build/contracts/RecurringPaymentWallet.json'); //how do we make this more robust?

const testNetwork = {
    recurringPaymentsWalletAddress : '0xb39CA142159DF2aE60857113c7De2d7FB8637dC7', 
    mnemonic : 'congress false detail border fade run purpose fantasy forum pink inside that',
    accounts : [
        '0xeBd52BE708F1ff0B3F2b4D2059b0Ec10457D74C4',
        '0x9c190d1B77384355232389Cf0952A87FdceAe88B',
        '0x165FFDfCddbbEacAa10ffe4eF70D6e1b7cbe9FFE',
        '0xC066371fBc2E4eFc07B43a429981Ad11b6f7E4Fd',
        '0x97903F954764143E74D17E2f52953Ec9D18c48dC',
        '0x51A1F94EAA818711ACa62018F904A41E572b69E5',
        '0x193f08D790791451fcFDeC9ec8a584FfC7E4484B',
        '0x3be528C61496a57dc218CFB1175fe79D3c478163',
        '0xbbe4a93B18057620d64201C2301E5200681836d7',
        '0x590E0F424e33c4450Fd8B95FfA16cC9b7dda10aF',
        '0x5df5b76e3442e5cb6b449e8bb7271689b41f4b3e',
        '0x24d540093f577d88d04c094d3098ff2e5dec0da8',
        '0xffc5d854fdafe23cf0c623565d882103ca0c89f3',
        '0x79618be13abdbd8b553d8e8223f74f8328050d7e',
        '0x539169485e23a8dd3c1c58796b900c478ec50381',
        '0x15afed03ba86022fcc24b134789b5583b065d954',
        '0xcb2b1b358232b6f6d26caa308b8ffde8402697e0',
        '0x5ea1c3ca556fed14e794391bb55e6845701b3932',
        '0x019b3bf36429eb27855471ea1f8a547ef050547b',
        '0xf1003daced3064a0ce0a3a06824d17b6bd7410c0',
        '0x99f17cb72cfc6d3fa208c730ba5a64a75e1b3878',
        '0x7d06e2b89d6bd2a7d910f2f028b82cf9381d3b93',
        '0xf93b769609fe17e59b2714c69b201c873f384142',
        '0xe6517e8611a1ab9050df5b01afc13729542b2cd2',
        '0xa8e95065a39291dafc0ad9567f4d4e70b62bbd65',
        '0xc01f545e9cce8ec316b5c29e5fa8f50ecf020814',
        '0xc748aa34da59d503de393b5deb53a3478190fe82',
        '0xabd064cec3ea0f924de06877c90ea82fc4d52259',
        '0x33c42b5aed7a0b9a1cd0345fb888893f6b1d49ce',
        '0x4ca9593bbe96e286e431ff535b3c97394c6f98b6']
    }

const recurringPaymentWallet = new web3.eth.Contract(RecurringPaymentWallet.abi, testNetwork.recurringPaymentsWalletAddress);
const sourceAccounts = testNetwork.accounts.slice(0,19);
const destinationAccounts = testNetwork.accounts.slice(20,29);
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

revertToSnapShot = (id, paymentScheduleCount) => {
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

    for await (const account of testNetwork.accounts) {
        let walletBalance = await recurringPaymentWallet.methods.getBalance().call({from : account});
        let accountBalance = await web3.eth.getBalance(account);
        let paymentScheduleCount = await recurringPaymentWallet.methods.paymentScheduleCount().call({from : account});
        console.log(`Account ${account}`); 
        console.log(`  Account balance      : ${web3.utils.fromWei(accountBalance, 'ether')} ETH`);
        console.log(`  Wallet balance       : ${web3.utils.fromWei(walletBalance, 'ether')} ETH`);
        console.log(`  Payment schedules    : ${paymentScheduleCount}`);
        console.log('\n');
    };

    let contractBalance = await web3.eth.getBalance(recurringPaymentWallet.options.address);
    console.log(`RecurringPaymentWallet contract balance   : ${web3.utils.fromWei(contractBalance, 'ether')} ETH`);
}
randomAmountInWei = (maxEth) => {
    return web3.utils.toWei(((Math.random() * maxEth) + 1).toString())
}

createRandomSubscription = async (account) => {
    const today = new Date();
    const randomDayInNextMonth = new Date(today + Math.floor(Math.random() * 30) + 1);
    const destination = destinationAccounts[Math.floor(Math.random() * 5)];
    try {
        console.log(`Creating payment schedule...`);

        await recurringPaymentWallet.methods.createPaymentSchedule(
                randomAmountInWei(1),
                1,
                randomDayInNextMonth.getFullYear(),
                randomDayInNextMonth.getMonth()+1,
                randomDayInNextMonth.getDate(),
                destination
            ).send({from : account, gas: 6721975});
    }
    catch (err) {
        console.error(err);
    }
}

//todo :
// move to ramda
// move testNetwork declaration to own file

async function run() {
    //Store blockchain state
    let snapShot = await takeSnapshot();
    let snapshotId = snapShot['result'];
    let amount;

    result = await printSummary('Initial state');
    try {
        for await (const account of sourceAccounts) {
            amount = randomAmountInWei(50);
            await recurringPaymentWallet.methods.deposit().send({from : account, value : amount});

            for (let index = 0; index < Math.floor(Math.random() * 20); index++) {
                await createRandomSubscription(account);
            }
        };

        result = await printSummary('After deposit state');
    } 
    finally {
        //restore blockchain state
        await revertToSnapShot(snapshotId);
    }
    
}

run();


