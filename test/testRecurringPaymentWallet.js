const RecurringPaymentWallet = artifacts.require("RecurringPaymentWallet");
const PaymentSchedule = artifacts.require("PaymentSchedule");
const truffleAssert = require('truffle-assertions');
const helper = require("./helpers/truffleTestHelper");


contract("RecurringPaymentWallet", accounts => {
    const owner = accounts[0];
    const hacker = accounts[1];

    beforeEach(async() => {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot['result'];
    });
    
    afterEach(async() => {
        await helper.revertToSnapShot(snapshotId);
    });

    it("should set constructor parameters correctly", async () => {
        let wallet = await RecurringPaymentWallet.new();
        let walletOwner = await wallet.owner();

        assert.equal(
            walletOwner, 
            owner, 
            "Wallet owner not set correctly"
        );
    });

    it("should be able to fund the wallet", async () => {
        let wallet = await RecurringPaymentWallet.new();
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

    it("should be able to withdraw from wallet", async () => {
        let wallet = await RecurringPaymentWallet.new();
        let depositAmount = 10000000;

        await wallet.deposit({value: depositAmount, from: owner});
        let balance = await wallet.getBalance();

        assert.equal(
            balance, 
            depositAmount, 
            "Wallet balance is incorrect"
        );

        let ownerInitialBalance = await web3.eth.getBalance(owner);
        const txInfo = await wallet.withdraw(depositAmount/2);

        // BALANCE AFTER TX needs to take gas cost and price into account
        const balanceAfter = await web3.eth.getBalance(owner)*1;
        const tx = await web3.eth.getTransaction(txInfo.tx);
        const gasCost = (tx.gasPrice*1) * (txInfo.receipt.gasUsed*1);
        let ownerFinalBalance = balanceAfter + gasCost;
        
        assert.equal(
            ownerFinalBalance, 
            ownerInitialBalance*1 + depositAmount/2, 
            "Should have deposited the correct amount to the owner address"
        );

        balance = await wallet.getBalance();

        assert.equal(
            balance, 
            depositAmount/2, 
            "Wallet balance is incorrect"
        );
    });

    it("should only allow the owner of a wallet to withdraw funds", async () => {
        let wallet = await RecurringPaymentWallet.new();
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
            "Sender not authorized."
        );
    });

    it("should not be able to withdraw more than you deposit", async () => {
        let wallet = await RecurringPaymentWallet.new();
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
            "Withdrawal request exceeds balance"
        );
    });

    it("should be able to create a payment schedule", async () => {
        let wallet = await RecurringPaymentWallet.new();
        const serviceProvider = accounts[2];

        let paymentScheduleResult = await wallet.createPaymentSchedule(
            10000,
            2,
            2019,
            12,
            12,
            serviceProvider);
        
        let count = await wallet.paymentScheduleCount();
        assert.equal(
            count,
            1,
            "There should be one payment schedule");

        //todo: 
        //  research the difference between calling functions that change state and ones that don't
        //  research Ethereum events
        let paymentScheduleAddress = await wallet.paymentSchedules(0);
        let paymentSchedule = await PaymentSchedule.at(paymentScheduleAddress);
        let owner = await paymentSchedule.owner();

        assert.equal(
            owner,
            wallet.address,
            "Payment schedule owner should be the payment schedule that created it");

    });

    it("should only allow wallet owner to create a payment schedule", async () => {
        let wallet = await RecurringPaymentWallet.new();
        const serviceProvider = accounts[2];

        await truffleAssert.reverts(
            wallet.createPaymentSchedule(
                10000,
                2,
                2019,
                12,
                12,
                serviceProvider, {from : hacker}),
            "Sender not authorized."
        );

    });

    it("should generate and fund due transactions", async () => {
        let wallet = await RecurringPaymentWallet.new();
        const serviceProvider = accounts[2];

        //fund wallet
        let depositAmount = 1000000000;
        await wallet.deposit({value: depositAmount, from: owner});

        //create 2 due payments and 2 that are not due
        await wallet.createPaymentSchedule(
            10000,
            2,
            2019,
            12,
            12,
            serviceProvider);
        
        //there should be 4 paymentSchedules

        //create + fund due payments
        
    });
    //should only fund transactions created by payment schedules owned by this wallet
    //should have a list of due transactions
    //should have an overduePayments flag

    //not required for PoC
    //should be able to cancel a recurring payment
    //should be able to pause a recurring payment
    //should be able to list all your recurring payments
});