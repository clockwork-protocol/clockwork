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

    //Helper function to get the latest payment from a payment schedule
    let getLatestPayment = async(paymentSchedule) => {
        latestPaymentAddress = await paymentSchedule.latestPayment(); //returns an address
        let latestPayment = await Payment.at(latestPaymentAddress); //get the payment at returned address
        return latestPayment;
    };

    //Helper function to get the a payment from a payment schedule
    let getPayment = async(paymentSchedule, position) => {
        latestPaymentAddress = await paymentSchedule.payments(position); //returns an address
        let latestPayment = await Payment.at(latestPaymentAddress); //get the payment at returned address
        return latestPayment;
    };

    beforeEach(async() => {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot['result'];
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
            destination);
 
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
        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment,
            1,
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()+1, 
            owner, 
            destination);

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
            destination);
        //check that the paymentSchedule is not due
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
        //create a due payment
        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment,
            1, 
            yesterday.getFullYear(),
            yesterday.getMonth()+1,
            yesterday.getDate(), 
            owner, 
            destination,
            {value: monthlyPayment, from: destination});

        //check that the paymentSchedule is due
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            true, 
            "PaymentSchedule should be due");
            
        //Check that the payment is not paid
        let result = await paymentSchedule.createNextPayment();
        let latestPayment = await getLatestPayment(paymentSchedule);
        let isPaid = await latestPayment.isPaid.call();
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
            {value: monthlyPayment*2, from: destination}); //creating 2 payments so need 2 payments
        
        //create a payment without paying it
        await paymentSchedule.createNextPayment();

        //try create a new payment, it should fail because nextDueDate has move on
        await truffleAssert.reverts(
            paymentSchedule.createNextPayment(),
            "PaymentSchedule must be due to create a payment"
        );
        
        //move time forward by one month
        const newBlock = await helper.advanceTimeAndBlock(helper.daysToSeconds(31));

        //create a new payment, it should fail because last payment hasn't been made yet
        await truffleAssert.reverts(
            paymentSchedule.createNextPayment(),
            "Can only create a new payment if last payment has been made"
        );

        //execute the payment
        let latestPayment = await getLatestPayment(paymentSchedule);
        await latestPayment.execute();

        //create a new payment, it should succeed
        await paymentSchedule.createNextPayment();
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
                destination),
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
            destination);

        //subscription should not be due
        let isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            false, 
            "paymentSchedule should not be due");
        
        //move time forward
        await helper.advanceTimeAndBlock(helper.daysToSeconds(2));

        //subscription should be due
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            true, 
            "paymentSchedule should now be due");

        //subscription should not be overdue
        let isOverdue = await paymentSchedule.isOverDue();
        assert.equal(
            isOverdue, 
            false, 
            "paymentSchedule should not be overdue");

        //move time forward
        await helper.advanceTimeAndBlock(helper.daysToSeconds(2));

        //subscription should be overdue
        isOverdue = await paymentSchedule.isOverDue();
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
            {value: monthlyPayment*2, from: destination});

        //subscription should not be due
        let isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            false, 
            "paymentSchedule should not be due");
        
        //move time forward
        await helper.advanceTimeAndBlock(helper.daysToSeconds(2));

        //subscription should be due
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            true, 
            "paymentSchedule should now be due");

        //create a new payment
        let result = await paymentSchedule.createNextPayment();

        //subscription should not be overdue
        let isOverdue = await paymentSchedule.isOverDue();
        assert.equal(
            isOverdue, 
            false, 
            "paymentSchedule should not be overdue");

        //move time forward
        await helper.advanceTimeAndBlock(helper.daysToSeconds(3));

        //subscription should be overdue
        isOverdue = await paymentSchedule.isOverDue();
        assert.equal(
            isOverdue, 
            true, 
            "paymentSchedule should be overdue");

        //execute the payment
        let latestPayment = await getLatestPayment(paymentSchedule);
        await latestPayment.execute();

        //subscription should not be overdue
        isOverdue = await paymentSchedule.isOverDue();
        assert.equal(
            isOverdue, 
            false, 
            "paymentSchedule should not be overdue");
    });

    it("should have a list of past payments", async () => {
        //create a payment schedule
        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment, 
            2,
            yesterday.getFullYear(),
            yesterday.getMonth()+1,
            yesterday.getDate(), 
            owner, 
            destination,
            {value: monthlyPayment*3, from: destination});

        //create payment
        await paymentSchedule.createNextPayment();

        //there should be one payment in list
        let paymentCount = await paymentSchedule.numberOfPayments();
        assert.equal(
            paymentCount, 
            1, 
            "There should be one payment in the list");

        //execute payment
        let payment = await getPayment(paymentSchedule, 0);
        await payment.execute();

        //move time forward
        await helper.advanceTimeAndBlock(helper.daysToSeconds(31));
        await paymentSchedule.createNextPayment();

        //there should be 2 payment in list
        paymentCount = await paymentSchedule.numberOfPayments();
        assert.equal(
            paymentCount, 
            2, 
            "There should be two payments in the list");

        //execute payment
        payment = await getPayment(paymentSchedule, 1);
        await payment.execute();
        
        //move time forward
        await helper.advanceTimeAndBlock(helper.daysToSeconds(31));
        await paymentSchedule.createNextPayment();

        //there should be 3 payment in list
        paymentCount = await paymentSchedule.numberOfPayments();
        assert.equal(
            paymentCount, 
            3, 
            "There should be three payments in the list");

        //execute payment
        payment = await getPayment(paymentSchedule, 2);
        await payment.execute();
    });

    // it("should only allow funding contracts as source", async () => {
        
    // });

    // it("should fund payments from the source payment contract", async () => {
        
    // });
});