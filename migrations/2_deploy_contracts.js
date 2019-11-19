var Payment = artifacts.require("Payment");
var PaymentSchedule = artifacts.require("PaymentSchedule");
var RecurringPaymentWallet = artifacts.require("RecurringPaymentWallet");

module.exports = async function(deployer) { 
    await deployer.deploy(Payment);
    await deployer.deploy(PaymentSchedule, Payment.address);
    await deployer.deploy(RecurringPaymentWallet, PaymentSchedule.address);
};