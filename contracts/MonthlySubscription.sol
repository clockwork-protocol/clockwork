pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/lib/BokkyPooBahsDateTimeLibrary.sol";

contract MonthlySubscription {
    address private owner;
    address private source;
    address private destination;
    uint public nextPaymentDate;
    uint private paymentLeeway;
    uint private amount = 0;
    Payment[] payments;

    constructor(uint firstPaymentYear, uint firstPaymentMonth, uint firstPaymentDay) public {
        require(BokkyPooBahsDateTimeLibrary.isValidDate(firstPaymentYear, firstPaymentMonth, firstPaymentDay), "Invalid first payment date");
        nextPaymentDate = BokkyPooBahsDateTimeLibrary.timestampFromDate(firstPaymentYear, firstPaymentMonth, firstPaymentDay);
    }

    function isDue() public view returns(bool) {
        return block.timestamp > nextPaymentDate;
    }

    function isOverDue() public returns(bool) {
        //is overdue when now > nextPaymentDate + paymentLeeway and duePayment.IsPaid = false
    }

    function getDuePayment() public returns(Payment) {
        //if isDue and duePayment.IsPaid create a new payment that is funded by owner
        //return new Payment(this);
    }
}