const PaymentSchedule = artifacts.require("PaymentSchedule");
const Payment = artifacts.require("Payment");
const helper = require("./helpers/truffleTestHelper");
const truffleAssert = require('truffle-assertions');

contract("PaymentSchedule", accounts => {
    var today = new Date();
    var yesterday = new Date(today -1);
    let owner = accounts[1];
    let destination = accounts[2];
    let monthlyPayment = 10000000;
    var paymentInst;
    var paymentAddress;

    //Helper function to get the latest payment from a payment schedule
    let getLatestPayment = async(paymentSchedule) => {
        latestPaymentAddress = await paymentSchedule.latestPayment(); //returns an address
        let latestPayment = await Payment.at(latestPaymentAddress); //get the payment at returned address
        return latestPayment;
    };

    beforeEach(async() => {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot['result'];
        paymentInst = await Payment.deployed();
        paymentAddress = paymentInst.address;
    });
    
    afterEach(async() => {
        await helper.revertToSnapShot(snapshotId);
    });

    it("should be due if last payment has not been made", async () => {
        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment, 
            1,
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()+1,
            owner,
            destination,
            paymentAddress);
 
        let isNextPaymentDue = await paymentSchedule.isNextPaymentDue.call();
        assert.equal(
            isNextPaymentDue, 
            false, 
            "paymentSchedule is not due until T+1 day");

        const newBlock = await helper.advanceTimeAndBlock(helper.daysToSeconds(2));
        
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue.call();
        assert.equal(
            isNextPaymentDue, 
            true, 
            "paymentSchedule should be due");
    });

    it("should set constructor parameters correctly", async () => {
        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment,
            1,
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()+1, 
            owner, 
            destination,
            paymentAddress);

        let paymentScheduleOwner = await paymentSchedule.owner();
        assert.equal(
            paymentScheduleOwner, 
            owner, 
            "Owner should be set correctly");

        let paymentScheduleDestination = await paymentSchedule.destination();
        assert.equal(
            paymentScheduleDestination, 
            destination, 
            "Service provider should be set correctly");

    });

    it("should not create a new payment if it isn't due", async () => {
        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment, 
            1,
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()+1, 
            owner, 
            destination,
            paymentAddress);
        //check that the paymentSchedule is not due
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue.call();
        assert.equal(
            isNextPaymentDue, 
            false, 
            "paymentSchedule should not be due");
            
        await truffleAssert.reverts(
            paymentSchedule.createNextPayment({value: monthlyPayment}),
            "PaymentSchedule must be due to create a payment"
        );
    });

    it("should return a new payment if it's due", async () => {
        //create a due payment
        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment,
            1, 
            yesterday.getFullYear(),
            yesterday.getMonth()+1,
            yesterday.getDate(), 
            owner, 
            destination,
            paymentAddress);

        //check that the paymentSchedule is due
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue.call();
        assert.equal(
            isNextPaymentDue, 
            true, 
            "PaymentSchedule should be due");
            
        //Check that the payment is not paid
        let result = await paymentSchedule.createNextPayment({value: monthlyPayment});

        //get latest payment
        let paymentID = await paymentSchedule.latestPaymentId();
        let isPaid = await paymentInst.isExecuted.call(paymentID);

        assert.equal(
            isPaid, 
            false, 
            "The new payment should be marked as unpaid."
        );
    });

    it("should only create a new payment if the last payment has been made", async () => {
        //create a due payment schedule
        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment, 
            1,
            yesterday.getFullYear(),
            yesterday.getMonth()+1,
            yesterday.getDate(), 
            owner, 
            destination,
            paymentAddress); //creating 2 payments so need 2 payments
        
        //create a payment without paying it
        await paymentSchedule.createNextPayment({value: monthlyPayment});

        //try create a new payment, it should fail because nextDueDate has move on
        await truffleAssert.reverts(
            paymentSchedule.createNextPayment({value: monthlyPayment}),
            "PaymentSchedule must be due to create a payment"
        );
        
        //move time forward by one month
        const newBlock = await helper.advanceTimeAndBlock(helper.daysToSeconds(31));

        //create a new payment, it should fail because last payment hasn't been made yet
        await truffleAssert.reverts(
            paymentSchedule.createNextPayment({value: monthlyPayment}),
            "Can only create a new payment if last payment has been made"
        );

        //execute the payment
        await paymentInst.execute(0);

        //create a new payment, it should succeed
        await paymentSchedule.createNextPayment({value: monthlyPayment});
    });

    it("should not allow payment leeway of less than 1 day", async () => {
        await truffleAssert.reverts(
            PaymentSchedule.new(
                monthlyPayment,
                0,
                today.getFullYear(),
                today.getMonth()+1,
                today.getDate()+1, 
                owner, 
                destination,
                paymentAddress),
            "Payment leeway must be more than or equal to one day");
    });

    it("should be overdue due if next due date is more than paymentLeeway days in the past", async () => {
        //create a payment schedule
        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment, 
            2,
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()+1, 
            owner, 
            destination,
            paymentAddress);

        //subscription should not be due
        let isNextPaymentDue = await paymentSchedule.isNextPaymentDue.call();
        assert.equal(
            isNextPaymentDue, 
            false, 
            "paymentSchedule should not be due");
        
        //move time forward
        await helper.advanceTimeAndBlock(helper.daysToSeconds(2));

        //subscription should be due
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue.call();
        assert.equal(
            isNextPaymentDue, 
            true, 
            "paymentSchedule should now be due");

        //subscription should not be overdue
        let isOverdue = await paymentSchedule.isOverDue.call();
        assert.equal(
            isOverdue, 
            false, 
            "paymentSchedule should not be overdue");

        //move time forward
        await helper.advanceTimeAndBlock(helper.daysToSeconds(2));

        //subscription should be overdue
        isOverdue = await paymentSchedule.isOverDue.call();
        assert.equal(
            isOverdue, 
            true, 
            "paymentSchedule should be overdue");
    });

    it("should be overdue due if there is an outstanding payment that was due more than paymentLeeway days in the past", async () => {
        //create a payment schedule
        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment, 
            2,
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()+1, 
            owner, 
            destination,
            paymentAddress);

        //subscription should not be due
        let isNextPaymentDue = await paymentSchedule.isNextPaymentDue.call();
        assert.equal(
            isNextPaymentDue, 
            false, 
            "paymentSchedule should not be due");
        
        //move time forward
        await helper.advanceTimeAndBlock(helper.daysToSeconds(2));

        //subscription should be due
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue.call();
        assert.equal(
            isNextPaymentDue, 
            true, 
            "paymentSchedule should now be due");

        //create a new payment
        let result = await paymentSchedule.createNextPayment({value: monthlyPayment});

        //subscription should not be overdue
        let isOverdue = await paymentSchedule.isOverDue.call();
        assert.equal(
            isOverdue, 
            false, 
            "paymentSchedule should not be overdue");

        //move time forward
        await helper.advanceTimeAndBlock(helper.daysToSeconds(3));

        //subscription should be overdue
        isOverdue = await paymentSchedule.isOverDue.call();
        assert.equal(
            isOverdue, 
            true, 
            "paymentSchedule should be overdue");

        //execute the payment
        await paymentInst.execute(0);

        //subscription should not be overdue
        isOverdue = await paymentSchedule.isOverDue.call();
        assert.equal(
            isOverdue, 
            false, 
            "paymentSchedule should not be overdue");
    });

    // it("should only allow funding contracts as source", async () => {
        
    // });

    // it("should fund payments from the source payment contract", async () => {
        
    // });
});