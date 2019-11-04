module.exports = {
  networks: {
      development: {
          host: "127.0.0.1",
          port: 7545,
          network_id: "*"
      },
      test: {
        host: 'localhost',
        port: 9545,
        network_id: '*',
        gas: 6.5e6,
        gasPrice: 5e9,
        websockets: true
      },
      coverage: {
        host: "localhost",
        network_id: "*",
        port: 8555,         // <-- If you change this, also set the port option in .solcover.js.
        gas: 0xfffffffffff, // <-- Use this high gas value
        gasPrice: 0x01      // <-- Use this low gas price
      },
  }
};