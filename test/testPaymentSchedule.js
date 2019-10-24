const PaymentSchedule = artifacts.require("PaymentSchedule");
const Payment = artifacts.require("Payment");
const helper = require("./helpers/truffleTestHelper");
const truffleAssert = require('truffle-assertions');

contract("PaymentSchedule", accounts => {
    var today = new Date();
    let owner = accounts[1];
    let destination = accounts[2];

    beforeEach(async() => {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot['result'];
    });
    
    afterEach(async() => {
        await helper.revertToSnapShot(snapshotId);
    });

    it("should be due if last payment has not been made", async () => {    
        let monthlyPayment = 10000000;

        let paymentSchedule = await PaymentSchedule.new(monthlyPayment, today.getFullYear(),today.getMonth()+1,today.getDate()+1, owner, destination);
 
        let isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            false, 
            "paymentSchedule is not due until T+1 day");

        const newBlock = await helper.advanceTimeAndBlock(helper.daysToSeconds(2));
        
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            true, 
            "paymentSchedule should be due");
    });

    it("should set constructor parameters correctly", async () => {
        let monthlyPayment = 10000000;

        let paymentSchedule = await PaymentSchedule.new(monthlyPayment,today.getFullYear(),today.getMonth()+1,today.getDate()+1, owner, destination);

        let paymentScheduleOwner = await paymentSchedule.owner();
        assert.equal(
            paymentScheduleOwner, 
            owner, 
            "Owner should be set correctly");

        let paymentScheduledestination = await paymentSchedule.destination();
        assert.equal(
            paymentScheduledestination, 
            destination, 
            "Service provider should be set correctly");

    });

    it("should not create a new payment if it isn't due", async () => {
        let monthlyPayment = 10000000;

        let paymentSchedule = await PaymentSchedule.new(monthlyPayment, today.getFullYear(),today.getMonth()+1,today.getDate()+1, owner, destination);
        //check that the paymentSchedule is due
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            false, 
            "paymentSchedule should not be due");
            
        await truffleAssert.reverts(
            paymentSchedule.createNextPayment(),
            "PaymentSchedule must be due to create a payment"
        );
    });

    it("should return a new payment if it's due", async () => {
        let monthlyPayment = 10000000;

        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment, 
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()-1, 
            owner, 
            destination,
            {value: monthlyPayment, from: destination});

        //check that the paymentSchedule is due
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            true, 
            "PaymentSchedule should be due");
            
        //Check that the pyment is not paid
        let result = await paymentSchedule.createNextPayment();
        currentPaymentAddress = await paymentSchedule.currentPayment();
        let currentPayment = await Payment.at(currentPaymentAddress);
        let isPaid = await currentPayment.isPaid.call();
        assert.equal(
             isPaid, 
             false, 
             "The new payment should be marked as unpaid."
        );
    });

    // it("should only create a payment if the last payment has been made", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should not allow payment leeway of less than 1 day", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should be overdue due if there is an outstanding payment that was due more than paymentLeeway days in the past", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should have a list of past payments", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should only have one due payment", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should not be overdue once due payment has been made", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should only allow funding contracts as source", async () => {
        
    // });

    // it("should fund payments from the source payment contract", async () => {
        
    // });
});