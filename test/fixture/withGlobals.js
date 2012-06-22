module.exports = function(){
    var interval = setInterval(function(){}, 1),
        timeouter = setTimeout(function(){
            clearInterval(interval);
        }, 1);

    clearTimeout(timeouter);
    return foo;
};