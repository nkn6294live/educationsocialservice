function test(info, arrays){
    for (var index = 0; index < arrays.length; index++) {
        console.log(info + "[" + arrays[index] + "]");
    }
}
function tests(arrays, ...infos) {
    for(var index = 0; index < arrays.length; index++) {
        test(infos[index], arrays);
    }
}

tests(["one", "two", "three"], ["1", "2", "3"]);