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
  }
};