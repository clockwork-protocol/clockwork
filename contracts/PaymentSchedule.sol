pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/lib/BokkyPooBahsDateTimeLibrary.sol";

//TODO::
// Get rid of constructor
// x Create struct to store payment schedule information
// Generate ID and store payment schedules in map
// Store and retrieve ID's by source
// Store and retrieve ID's by destination

contract PaymentSchedule {

    struct PaymentScheduleDetails {
        uint nextPaymentDate;
        uint paymentLeeway;
        address owner;
        address payable destination;
        uint subscriptionAmmount;
        bytes32 latestPaymentId;
    }

    Payment private payment;
    PaymentScheduleDetails private details;

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

        details.nextPaymentDate = BokkyPooBahsDateTimeLibrary.timestampFromDate(firstPaymentYear, firstPaymentMonth, firstPaymentDay);
        details.owner = _owner;
        details.destination = _destination;
        details.subscriptionAmmount = _subscriptionAmmount;
        details.paymentLeeway = _paymentLeeway;
        payment = _payment;
    }

    function owner()
        external
        view
        returns(address)
    {
        return details.owner;
    }

    function subscriptionAmmount()
        external
        view
        returns(uint)
    {
        return details.subscriptionAmmount;
    }

    function destination()
        external
        view
        returns(address)
    {
        return details.destination;
    }

    function latestPaymentId()
        external
        view
        returns(bytes32)
    {
        return details.latestPaymentId;
    }

    function createNextPayment()
        external
        payable
    {
        require(isNextPaymentDue(), "PaymentSchedule must be due to create a payment");
        require(payment.isExecuted(details.latestPaymentId), "Can only create a new payment if last payment has been made");
        require(msg.value >= details.subscriptionAmmount, "Insufficient funds to fund payment");

        details.latestPaymentId = payment.createPayment.value(details.subscriptionAmmount)
            (details.destination,
            details.subscriptionAmmount,
            overdueDate());

        details.nextPaymentDate = BokkyPooBahsDateTimeLibrary.addMonths(details.nextPaymentDate, 1);
    }

    function isOverDue()
        external
        view
        returns(bool)
    {
        bool isSubscriptionOverdue = block.timestamp > overdueDate();
        bool isLatestPaymentOverdue = payment.isOverdue(details.latestPaymentId);
        return isSubscriptionOverdue || isLatestPaymentOverdue;
    }

    function isNextPaymentDue()
        public
        view
        returns(bool)
    {
        return block.timestamp > details.nextPaymentDate;
    }

    function overdueDate()
        private
        view
        returns(uint)
    {
        return BokkyPooBahsDateTimeLibrary.addDays(details.nextPaymentDate, details.paymentLeeway);
    }
}