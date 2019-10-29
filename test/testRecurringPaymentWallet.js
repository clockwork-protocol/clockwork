const RecurringPaymentWallet = artifacts.require("RecurringPaymentWallet");

contract("RecurringPaymentWallet", accounts => {
    let owner = accounts[0];

    it("should set constructor parameters correctly", async () => {
        let wallet = await RecurringPaymentWallet.new();
        let walletOwner = await wallet.owner();

        assert.equal(
            walletOwner, 
            owner, 
            "Wallet owner not set ciorrectly"
        );
    });

    //should be able to fund the wallet
    //should be able to withdraw from wallet
    //should only allow the owner of a wallet to withdraw funds
    //should not be able to withdraw more than you deposit
    //should be able to create a recurring payment
    //should only allow wallet owner to create a recurring payment
    //should be able to fund a transaction for a recurring payment
    //should only allow recurring payments created by this wallet to fund transactions
    //should generate due transactions
    //should have a list of due transactions

    //not required for PoC
    //should be able to cancel a recurring payment
    //should be able to pause a recurring payment
    //should be able to list all your recurring payments
});