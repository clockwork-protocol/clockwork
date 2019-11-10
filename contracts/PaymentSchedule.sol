pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/lib/BokkyPooBahsDateTimeLibrary.sol";


contract PaymentSchedule {
    uint public nextPaymentDate;
    uint public paymentLeeway;
    address public owner;
    address payable public destination;
    uint public subscriptionAmmount = 0;
    Payment public payment;
    bytes32 public latestPaymentId;

    constructor(uint _subscriptionAmmount,
                uint _paymentLeeway,
                uint firstPaymentYear,
                uint firstPaymentMonth,
                uint firstPaymentDay,
                address _owner,
                address payable _destination,
                Payment _payment)
        public
    {
        require(BokkyPooBahsDateTimeLibrary.isValidDate(firstPaymentYear, firstPaymentMonth, firstPaymentDay), "Invalid first payment date");
        require(_paymentLeeway >= 1, "Payment leeway must be more than or equal to one day");

        nextPaymentDate = BokkyPooBahsDateTimeLibrary.timestampFromDate(firstPaymentYear, firstPaymentMonth, firstPaymentDay);
        owner = _owner;
        destination = _destination;
        subscriptionAmmount = _subscriptionAmmount;
        paymentLeeway = _paymentLeeway;
        payment = _payment;
    }

    function createNextPayment()
        external
        payable
    {
        require(isNextPaymentDue(), "PaymentSchedule must be due to create a payment");
        require(payment.isExecuted(latestPaymentId), "Can only create a new payment if last payment has been made");
        require(msg.value >= subscriptionAmmount, "Insufficient funds to fund payment");

        latestPaymentId = payment.createPayment.value(subscriptionAmmount)(destination, subscriptionAmmount, overdueDate());
        nextPaymentDate = BokkyPooBahsDateTimeLibrary.addMonths(nextPaymentDate, 1);
    }

    function isOverDue()
        external
        view
        returns(bool)
    {
        bool isSubscriptionOverdue = block.timestamp > overdueDate();
        bool isLatestPaymentOverdue = payment.isOverdue(latestPaymentId);
        return isSubscriptionOverdue || isLatestPaymentOverdue;
    }

    function isNextPaymentDue()
        public
        view
        returns(bool)
    {
        return block.timestamp > nextPaymentDate;
    }

    function overdueDate()
        private
        view
        returns(uint)
    {
        return BokkyPooBahsDateTimeLibrary.addDays(nextPaymentDate, paymentLeeway);
    }
}