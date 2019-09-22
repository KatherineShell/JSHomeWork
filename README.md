Полифил для Promise.

Проверяется наличие нативных Promise и реализуестся полифил внутри IIFE.
Выполняются асинхронные операции через resolve или reject.

Бонус. Работа методов.

Promise.resolve

Promise.resolve(5).then(function(result){
    console.log(result, 'resolved')     //выведет 5 resolved
}, function(err){
    console.log(err, 'error')           //будет проигнорировано
});

Promise.reject

Promise.reject(5).then(function(result){
    console.log(result, 'resolved')     //будет проигнорировано 
}, function(err){
    console.log(err, 'error')           //выведет 5 error
});

Promise.all

var promise = new Promise(function (resolve, rej) {
        setTimeout(function () {
            resolve(42)
        }, 2000)
    });

var promise2 = new Promise(function (res, rej) {
        res(73)
    });

    
Promise.all([promise, promise2]).then(function (result) {
    console.log(result, 'resolved')         //выведет [42, 73] "resolved"
}, function (err) {
    console.log(err, 'error')               //будет проигнорировано
})


var promise = new Promise(function (resolve, rej) {
        setTimeout(function () {
            rej(42)                         //имитация ошибки
        }, 2000)
    });

var promise2 = new Promise(function (res, rej) {
        res(73)
    });

    
Promise.all([promise, promise2]).then(function (result) {
    console.log(result, 'resolved')         //будет проигнорировано
}, function (err) {
    console.log(err, 'error')               //выведет 42 error
})

Promise.race

var promise = new Promise(function (resolve, rej) {
        setTimeout(function () {
            resolve(42)                         //имитация ошибки
        }, 2000)
    });

var promise2 = new Promise(function (res, rej) {
        res(73)
    });

    
Promise.race([promise, promise2]).then(function (result) {
    console.log(result, 'resolved')         //выведет 73 resolved
}, function (err) {
    console.log(err, 'error')               //будет проигнорировано
})

Супер Бонус

finally

 var promise = new Promise(function (resolve, rej) {
        setTimeout(function () {
            resolve(42)
        }, 2000)

    })

 promise
         .finally(function () {
             console.log('finally 1')           //выведет finally 1
         })
         .then(function (result) {
             console.log(result, ' result')     //выведет 42 result
         },
             function (err) {
                 console.log(err, ' my err')    //будет проигнорировано
             }
         )
         .finally(function () {
             return new Promise(function (res, rej) {
                 res(73)
             });
         })
         .then(function (err) {
             console.log(err, ' result 2')       //выведет 73 result 2
         })

done

 var promise = new Promise(function (resolve, rej) {
        setTimeout(function () {
            resolve(42)
        }, 2000)

    })

 promise
         .finally(function () {
             console.log('finally 1')           //выведет finally 1
         })
         .then(function (result) {
             console.log(result, ' result')      //выведет 42 result
         },
             function (err) {
                 console.log(err, ' my err')     //будет проигнорировано
             }
         )
         .finally(function () {
             return new Promise(function (res, rej) {
                 res(73)
             });
         })
         .done(function (data) {
             console.log(data, 'done')          //выведет 73 done и прервет цепочку
         })
         .then(function (err) {
             console.log(err, ' result 2')      //будет проигнорировано
         })


var promise = new Promise(function (resolve, rej) {
    setTimeout(function () {
        rej(42)
    }, 2000)
})

promise
        .done(function (data) {
            console.log(data, 'done')          //выведет 42 done и прервет цепочку
        })
        .then(function (err) {
            console.log(err, ' result 2')      //будет проигнорировано
        })

Потенциальные ошибки.

Цепочка на успех обрабатывает и передает значение следующему звену, но catch не ловит ошибки.
Ошибки может обработать метод then error callback, но следующее звену не запускается.
Буду рада, если поможете разобраться.

Пример.

var promise = new Promise(function (resolve, rej) {
        rej(42);
    })

 promise
        .then(function (data) {
            console.log(data, ' result 2')      //будет проигнорировано
        },
            function (data) {
                console.log(data, ' error')     //выведет 42 error и обработает ошибку
            }
        ).then(function (data) {
            console.log(data, ' result 3')      //будет проигнорировано (неверное поведение!)
        })