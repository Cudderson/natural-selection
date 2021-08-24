function testModule(message) {
    console.log(message);
}

// to test my method, log INITIAL_X
function findX() {
    console.log(INITIAL_X);
}

function findSammy() {
    console.log(simGlobals.sammy);
}

export { testModule, findX, findSammy }