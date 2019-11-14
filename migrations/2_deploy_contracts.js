var Payment = artifacts.require("Payment");
var PaymentSchedule = artifacts.require("PaymentSchedule");
var RecurringPaymentWallet = artifacts.require("RecurringPaymentWallet");

module.exports = function(deployer) { 
    deployer.deploy(Payment).then(function() {
        return deployer.deploy(PaymentSchedule, Payment.address).then(function() {
            return deployer.deploy(RecurringPaymentWallet, PaymentSchedule.address);
        });
    });
};