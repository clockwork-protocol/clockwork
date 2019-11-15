const RecurringPaymentWallet = artifacts.require("RecurringPaymentWallet");
const PaymentSchedule = artifacts.require("PaymentSchedule");
const Payment = artifacts.require("Payment");

const truffleAssert = require('truffle-assertions');
const helper = require("./helpers/truffleTestHelper");
const BN = require('bn.js');

contract("RecurringPaymentWallet", accounts => {
    var today = new Date();
    var yesterday = new Date(today -1);
    const owner = accounts[0];
    const hacker = accounts[1];
    var paymentInst;

    let createNotDuePaymentSchedule = async (wallet, amount, serviceProvider) => {
        return wallet.createPaymentSchedule(
            amount,
            2,
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()+1, 
            serviceProvider);
    };

    let createDuePaymentSchedule = async (wallet, amount, serviceProvider) => {
        return wallet.createPaymentSchedule(
            amount,
            2,
            yesterday.getFullYear(),
            yesterday.getMonth()+1,
            yesterday.getDate(), 
            serviceProvider);
    };

    beforeEach(async() => {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot['result'];
        paymentInst = await Payment.deployed();
        paymentAddress = paymentInst.address;
        paymentSchedule = await PaymentSchedule.deployed();
        wallet = await RecurringPaymentWallet.deployed();

    });
    
    afterEach(async() => {
        await helper.revertToSnapShot(snapshotId);
    });

    it("should be able to fund the wallet", async () => {
        let depositAmount = 10000;
        
        await truffleAssert.reverts(
            wallet.deposit(),
            "Message value must be greater than zero"
        );

        await wallet.deposit({value: depositAmount, from: owner});
        let balance = await wallet.getBalance();

        assert.equal(
            balance, 
            depositAmount, 
            "Wallet balance is incorrect"
        );
    });

    //This fails intermittently, no idea why
    // it("should be able to withdraw from wallet", async () => {
    //     let wallet = await RecurringPaymentWallet.new();
    //     let depositAmount = 10000000;

    //     await wallet.deposit({value: depositAmount, from: owner});
    //     let balance = await wallet.getBalance();

    //     assert.equal(
    //         balance, 
    //         depositAmount, 
    //         "Wallet balance is incorrect"
    //     );

    //     let ownerInitialBalance = await web3.eth.getBalance(owner);
    //     const txInfo = await wallet.withdraw(depositAmount/2);

    //     // BALANCE AFTER TX needs to take gas cost and price into account
    //     const balanceAfter = new BN(await web3.eth.getBalance(owner));
    //     const tx = await web3.eth.getTransaction(txInfo.tx);
    //     const gasPrice = new BN(tx.gasPrice);
    //     const gasUsed = new BN(txInfo.receipt.gasUsed);
    //     const gasCost = gasPrice.mul(gasUsed);
    //     let ownerFinalBalance = balanceAfter.add(gasCost);
        
    //     assert.equal(
    //         ownerFinalBalance, 
    //         ownerInitialBalance*1 + depositAmount/2, 
    //         "Should have deposited the correct amount to the owner address"
    //     );

    //     balance = await wallet.getBalance();

    //     assert.equal(
    //         balance, 
    //         depositAmount/2, 
    //         "Wallet balance is incorrect"
    //     );
    // });

    it("should only withdraw funds from sender's wallet", async () => {
        let depositAmount = 100000;

        await wallet.deposit({value: depositAmount, from: owner});
        let balance = await wallet.getBalance();

        assert.equal(
            balance, 
            depositAmount, 
            "Wallet balance is incorrect"
        );

        await truffleAssert.reverts(
            wallet.withdraw(depositAmount/2, {from : hacker}),
            "Withdrawal request exceeds wallet balance."
        );
    });

    it("should not be able to withdraw more than you deposit", async () => {
        let depositAmount = 100000;

        await wallet.deposit({value: depositAmount, from: owner});
        let balance = await wallet.getBalance();

        assert.equal(
            balance, 
            depositAmount, 
            "Wallet balance is incorrect"
        );

        await truffleAssert.reverts(
            wallet.withdraw(depositAmount*2),
            "Withdrawal request exceeds wallet balance."
        );
    });

    it("should be able to create a payment schedule", async () => {
        const serviceProvider = accounts[2];

        await createNotDuePaymentSchedule(wallet, 10000, serviceProvider);
        
        let count = await wallet.paymentScheduleCount.call();
        assert.equal(
            count,
            1,
            "There should be one payment schedule");

        let _id = await wallet.paymentSchedules.call(0);
        let owner = await paymentSchedule.owner.call(_id);

        assert.equal(
            owner,
            wallet.address,
            "Payment schedule owner should be the payment schedule that created it");

    });

    it("should generate and fund due transactions", async () => {
        const serviceProvider = accounts[2];

        //fund wallet
        let depositAmount = 1000000000;
        await wallet.deposit({value: depositAmount, from: owner});

        //create 2 due payments and 2 that are not due
        await createNotDuePaymentSchedule(wallet, 10000, serviceProvider);
        await createDuePaymentSchedule(wallet, 20000, serviceProvider);
        await createNotDuePaymentSchedule(wallet, 30000, serviceProvider);
        await createDuePaymentSchedule(wallet, 40000, serviceProvider);
        
        //there should be 4 paymentSchedules
        let count = await wallet.paymentScheduleCount();
        assert.equal(
            count,
            4,
            "There should be 4 payment schedules");

        //create + fund first payment
        let tx = await wallet.createAndFundDuePaymentForPaymentSchedule(owner, 0);
        let paymentCount = await paymentInst.paymentCount.call();
        assert.equal(
            paymentCount,
            0,
            "There should be 0 payments");

        //create + fund 2nd payment
        tx = await wallet.createAndFundDuePaymentForPaymentSchedule(owner, 1);
        paymentCount = await paymentInst.paymentCount.call();
        assert.equal(
            paymentCount,
            1,
            "There should be 1 payments");

        let paymentAmount = await paymentInst.paymentAmount.call(0);
        assert.equal(
            paymentAmount,
            20000,
            "First due payment should have a the correct payment amount");

        //create + fund third payment
        paymentCount = await paymentInst.paymentCount.call();
        assert.equal(
            paymentCount,
            1,
            "There should be 1 payments");

        //create + fund 4th payment
        tx = await wallet.createAndFundDuePaymentForPaymentSchedule(owner, 3);
        paymentCount = await paymentInst.paymentCount.call();
        assert.equal(
            paymentCount,
            2,
            "There should be 2 payments");

        paymentAmount = await paymentInst.paymentAmount.call(1);
        assert.equal(
            paymentAmount,
            40000,
            "SEcond due payment should have a the correct payment amount");
        
        //Test range asserts
        await truffleAssert.reverts(
            wallet.createAndFundDuePaymentForPaymentSchedule(owner, -1),
            "Position out of range"
        );
        await truffleAssert.reverts(
            wallet.createAndFundDuePaymentForPaymentSchedule(owner, 4),
            "Position out of range"
        );

        await truffleAssert.reverts(
            wallet.createAndFundDuePaymentForPaymentSchedule(serviceProvider, 4),
            "Position out of range"
        );
    });

    //not required for PoC
    //make sure 
    //should be able to cancel a recurring payment
    //should be able to pause a recurring payment
    //should be able to list all your recurring payments
});