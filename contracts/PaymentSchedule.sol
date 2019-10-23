pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/lib/BokkyPooBahsDateTimeLibrary.sol";

//TODO ::
// remove payable from constructor
//
contract PaymentSchedule {
    uint public nextPaymentDate;
    address public owner;
    address payable public destination;
    uint public subscriptionAmmount = 0;
    Payment public currentPayment;

    constructor(uint _subscriptionAmmount,
                uint firstPaymentYear,
                uint firstPaymentMonth,
                uint firstPaymentDay,
                address _owner,
                address payable _destination) public payable {
        require(BokkyPooBahsDateTimeLibrary.isValidDate(firstPaymentYear, firstPaymentMonth, firstPaymentDay), "Invalid first payment date");
        nextPaymentDate = BokkyPooBahsDateTimeLibrary.timestampFromDate(firstPaymentYear, firstPaymentMonth, firstPaymentDay);
        owner = _owner;
        destination = _destination;
        subscriptionAmmount = _subscriptionAmmount;
    }

    function isDue() public view returns(bool) {
        return block.timestamp > nextPaymentDate;
    }

    function isOverDue() public returns(bool) {
        //is overdue when now > nextPaymentDate + paymentLeeway and duePayment.IsPaid = false
    }

    function createPayment() public {
        require(isDue(), "PaymentSchedule must be due to create a payment");
        //todo fund the payment from funding contract
        currentPayment = (new Payment).value(subscriptionAmmount)(destination);
    }
}