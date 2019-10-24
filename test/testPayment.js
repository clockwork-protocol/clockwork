const Payment = artifacts.require("Payment");
const truffleAssert = require('truffle-assertions');

contract("Payment", accounts => {
    let destination = accounts[2];
    let source = accounts[1];
    let payment = 1000000000000000;

    it("should pay the destination the appropriate ammount", async () => {
        //get account balances before payment
        let destinationInitialBalance = await web3.eth.getBalance(destination);
        
        //create a new payment
        let newPayment = await Payment.new(destination, payment, {value: payment, from: source});
        let isPaid = await newPayment.isPaid.call();
        assert.equal(
            isPaid, 
            false, 
            "A new payment should be marked as unpaid."
        );

        //get account balances before payment
        let destinationBalance = await web3.eth.getBalance(destination);    

        assert.equal(
            destinationInitialBalance,
            destinationBalance,
            "Destination should not receive payment untill after payment executed"
        );

        let result = await newPayment.execute();
        destinationBalance = await web3.eth.getBalance(destination);

        assert.equal(
            destinationBalance,
            (destinationInitialBalance*1) + (payment*1),
            "Destination should receive payment after payment executed"
        );

        isPaid = await newPayment.isPaid.call();
        assert.equal(
            isPaid, 
            true, 
            "Payment should be marked as paid after the payment is complete."
        );
    });

    it("should set payment ammount correctly", async () => {
        //create a new payment
        let newPayment = await Payment.new(destination, payment, {value: payment, from: source});
        let paymentAmount = await newPayment.paymentAmount.call();
        assert.equal(
            paymentAmount, 
            payment, 
            "Payment ammount should be correct."
        );
    });

    it("should not execute if the contract doesn't have enough funds", async () => {   
        let fundAmount = payment - 100;     
        //create a new payment but fund it with less than is required
        let newPayment = await Payment.new(destination, payment, {value: fundAmount, from: source});
        let isPaid = await newPayment.isPaid.call();
        assert.equal(
            isPaid, 
            false, 
            "A new payment should be marked as unpaid."
        );  

        await truffleAssert.reverts(
            newPayment.execute(),
            "Insufficient funds to execute payment"
        );
    });

    it("should only execute once", async () => {
        //create a new payment
        let newPayment = await Payment.new(destination, payment, {value: payment, from: source});
        let isPaid = await newPayment.isPaid.call();
        assert.equal(
            isPaid, 
            false, 
            "A new payment should be marked as unpaid."
        );

        //execute the payment
        let result = await newPayment.execute();

        //check that it is paid
        isPaid = await newPayment.isPaid.call();
        assert.equal(
            isPaid, 
            true, 
            "Payment should be marked as paid after the payment is complete."
        );
        
        //try execute it again
        await truffleAssert.reverts(
            newPayment.execute(),
            "Payment has already executed"
        );
    });

    // it("should be funded if the contract balance equals or exceeds the payment ammount", async () => {});

    // it("should only pay the correct ammount and return the excess to the funding contract", async () => {});
});