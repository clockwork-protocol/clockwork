const MonthlySubscription = artifacts.require("MonthlySubscription");
const helper = require("./helpers/truffleTestHelper");

contract("Subscription", accounts => {
    beforeEach(async() => {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot['result'];
    });
    
    afterEach(async() => {
        await helper.revertToSnapShot(snapshotId);
    });

    it("should be due if next payment date is in the past and payment has not been made", async () => {    
        var today = new Date();
        let subscription = await MonthlySubscription.new(today.getFullYear(),today.getMonth()+1,today.getDate()+1);
 
        let isDue = await subscription.isDue();
        assert.equal(isDue, false, "Subscription is not due until T+1 day");

        const newBlock = await helper.advanceTimeAndBlock(helper.daysToSeconds(2));
        
        isDue = await subscription.isDue();
        assert.equal(isDue, true, "Subscription should be due");
    });

    // it("should be overdue due if next payment date is moe than paymentLeeway days in the past and payment has not been made", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should not allow payment leeway of less than 1 day", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should only create a payment if payment date is in the past and there is no payment for that date", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should have a list of past payments", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should not be overdue once payment has been made", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should not create new due payments while the subsription is overdue", async () => {
        
    // });
});