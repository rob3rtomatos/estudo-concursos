module.exports = async function globalTeardown() {
  // pools nos workers já fechados via closePool() nos afterAll
  // este teardown é no processo principal — sem acesso aos workers
  // com forceExit:true o Jest encerra mesmo com handles abertos
};
