pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/lib/BokkyPooBahsDateTimeLibrary.sol";

contract PaymentSchedule {
    uint public nextPaymentDate;
    uint public paymentLeeway;
    address public owner;
    address payable public destination;
    uint public subscriptionAmmount = 0;
    Payment[] public payments;

    constructor(uint _subscriptionAmmount,
                uint _paymentLeeway,
                uint firstPaymentYear,
                uint firstPaymentMonth,
                uint firstPaymentDay,
                address _owner,
                address payable _destination)
        public
    {
        require(BokkyPooBahsDateTimeLibrary.isValidDate(firstPaymentYear, firstPaymentMonth, firstPaymentDay), "Invalid first payment date");
        require(_paymentLeeway >= 1, "Payment leeway must be more than or equal to one day");

        nextPaymentDate = BokkyPooBahsDateTimeLibrary.timestampFromDate(firstPaymentYear, firstPaymentMonth, firstPaymentDay);
        owner = _owner;
        destination = _destination;
        subscriptionAmmount = _subscriptionAmmount;
        paymentLeeway = _paymentLeeway;
    }

    function isNextPaymentDue()
        public
        view
        returns(bool)
    {
        return block.timestamp > nextPaymentDate;
    }

    function latestPayment()
        public
        view
        returns(Payment)
    {
        require(payments.length > 0, "No payments created yet");
        return payments[payments.length-1];
    }

    function numberOfPayments()
        external
        view
        returns(uint)
    {
        return payments.length;
    }

    function overdueDate()
        private
        view
        returns(uint)
    {
        return BokkyPooBahsDateTimeLibrary.addDays(nextPaymentDate, paymentLeeway);
    }

    function isOverDue()
        external
        view
        returns(bool)
    {
        bool isSubscriptionOverdue = block.timestamp > overdueDate();
        bool isLatestPaymentOverdue = payments.length > 0 && latestPayment().isOverdue();
        return isSubscriptionOverdue || isLatestPaymentOverdue;
    }

    function createNextPayment()
        external
        payable
    {
        require(isNextPaymentDue(), "PaymentSchedule must be due to create a payment");
        if (payments.length > 0) {
            require(latestPayment().isPaid(), "Can only create a new payment if last payment has been made");
        }
        require(msg.value >= subscriptionAmmount, "Insufficient funds to fund payment");

        payments.push((new Payment).value(subscriptionAmmount)(destination, subscriptionAmmount, overdueDate()));
        nextPaymentDate = BokkyPooBahsDateTimeLibrary.addMonths(nextPaymentDate, 1);
    }
}