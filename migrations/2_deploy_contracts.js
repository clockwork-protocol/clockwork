var Payment = artifacts.require("Payment");
//var PaymentSchedule = artifacts.require("PaymentSchedule");

module.exports = function(deployer) { 
    deployer.deploy(Payment);
};