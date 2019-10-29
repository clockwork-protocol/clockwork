pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/lib/BokkyPooBahsDateTimeLibrary.sol";

//TODO ::
// remove payable from constructor
// fund the payment from funding contract
//  - Dont create new payments if not enough funds in funding contract
// add getDuePayments
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
        payable
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
        //todo:: shouldn't this also look at latestPayment().isPaid()? Yes probably
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
        public
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
        public
        view
        returns(bool)
    {
        bool isSubscriptionOverdue = block.timestamp > overdueDate();
        bool isLatestPaymentOverdue = payments.length > 0 && latestPayment().isOverdue();
        return isSubscriptionOverdue || isLatestPaymentOverdue;
    }

    function createNextPayment()
        public
    {
        require(isNextPaymentDue(), "PaymentSchedule must be due to create a payment");
        if (payments.length > 0) {
            require(latestPayment().isPaid(), "Can only create a new payment if last payment has been made");
        }
        require(address(this).balance >= subscriptionAmmount, "Insufficient funds to fund payment");
        //todo fund the payment from funding contract
        //don't create payment if not enough funds
        payments.push((new Payment).value(subscriptionAmmount)(destination, subscriptionAmmount, overdueDate()));
        nextPaymentDate = BokkyPooBahsDateTimeLibrary.addMonths(nextPaymentDate, 1);
    }
}