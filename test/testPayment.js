const Payment = artifacts.require("Payment");

contract("Payment", accounts => {
    it(" should pay the destination the appropriate ammount", async () => {
        let destination = accounts[2];
        let source = accounts[1];
        let payment = 1000000000000000000;
        
        //get account balances before payment
        let destinationInitialBalance = await web3.eth.getBalance(destination);
        
        //create a new payment
        let newPayment = await Payment.new(destination, {value: payment, from: source});
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
});