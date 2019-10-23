pragma solidity >=0.4.25 <0.6.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/MonthlySubscription.sol";

contract TestSubscription {

    function testSetNextPaymentDateOnCreation() public {
        address payable serviceProvider = address(uint160(address(this)));
        MonthlySubscription sub = new MonthlySubscription(1000, 1990, 5, 13, address(this), serviceProvider);

        Assert.equal(BokkyPooBahsDateTimeLibrary.getYear(sub.nextPaymentDate()), 1990, "Nextpayment year should be set correctly");
        Assert.equal(BokkyPooBahsDateTimeLibrary.getMonth(sub.nextPaymentDate()), 5, "Nextpayment Month should be set correctly");
        Assert.equal(BokkyPooBahsDateTimeLibrary.getDay(sub.nextPaymentDate()), 13, "Nextpayment Day should be set correctly");
    }
}