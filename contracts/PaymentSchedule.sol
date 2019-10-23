pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/lib/BokkyPooBahsDateTimeLibrary.sol";

//TODO ::
//Set service provider
//
contract PaymentSchedule {
    uint public nextPaymentDate;
    address public owner;
    address payable public serviceProvider;
    uint public subscriptionAmmount = 0;
    Payment public currentPayment;

    constructor(uint _subscriptionAmmount,
                uint firstPaymentYear,
                uint firstPaymentMonth,
                uint firstPaymentDay,
                address _owner,
                address payable _serviceProvider) public {
        require(BokkyPooBahsDateTimeLibrary.isValidDate(firstPaymentYear, firstPaymentMonth, firstPaymentDay), "Invalid first payment date");
        nextPaymentDate = BokkyPooBahsDateTimeLibrary.timestampFromDate(firstPaymentYear, firstPaymentMonth, firstPaymentDay);
        owner = _owner;
        serviceProvider = _serviceProvider;
        subscriptionAmmount = _subscriptionAmmount;
    }

    function isDue() public view returns(bool) {
        return block.timestamp > nextPaymentDate;
    }

    function isOverDue() public returns(bool) {
        //is overdue when now > nextPaymentDate + paymentLeeway and duePayment.IsPaid = false
    }

    function createPayment() public returns(Payment) {
        require(isDue(), "Subscription must be due to create a payment");
        //todo fund the payment
        return (new Payment).value(subscriptionAmmount)(serviceProvider);
    }
}