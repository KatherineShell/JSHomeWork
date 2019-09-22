'use strict';

(function (globalObject) {

    if (globalObject && !globalObject.Promise) {

        var PromiseStates = {
            pending: 'pending',
            rejected: 'rejected',
            resolved: 'resolved'
        };

        var isFunction = function (func) {
            return typeof func === 'function';
        }

        var isObject = function (obj) {
            return typeof obj === 'object';
        }

        var isArray = function (arr) {
            return Object.prototype.toString.call(arr) === '[object Array]';
        }

        function Promise(pendingRequest) {

            if (isFunction(pendingRequest)) {

                var status = PromiseStates.pending;
                var resultData = null;
                var resolveCallback = null;
                var rejectCallback = null;
                var promiseReturn = null;
                var finallyReturn = null;
                var doneReturn = null;
                var promiseRejReturn = null;

                var onDone = function (doneCalback) {
                    if (isFunction(doneCalback)) {

                        return new Promise(function (res) {
                            doneReturn = doneCalback;

                            if (status !== PromiseStates.pending) {
                                doneCalback(resultData);
                            }
                        });
                    }
                }

                var onFinally = function (finallyCalback) {
                    if (isFunction(finallyCalback)) {

                        return new Promise(function (res) {
                            finallyReturn = [res, finallyCalback];

                            if (status !== PromiseStates.pending) {

                                var finallyResult = finallyCalback();

                                if (finallyResult instanceof Promise) {
                                    finallyResult.then(function (result) {
                                        res(result);
                                    });
                                }
                                else res(resultData);
                            }
                        });
                    }
                }

                var onCatch = function (errorCallback) {
                    return this.onFail = function () {

                        if (isFunction(errorCallback)) {

                            rejectCallback = errorCallback;

                            return new Promise(function (res) {

                                promiseRejReturn = [res, errorCallback];

                                if (status === PromiseStates.rejected) {

                                    if (resultData instanceof Promise) {
                                        resultData.then(function (result) {
                                            res(rejectCallback(result));
                                        })
                                    }
                                    else res(rejectCallback(resultData));
                                }
                            });

                        }
                    }();
                };

                var onThen = function (successCallback, errorCallback) {
                    if (errorCallback) onCatch.call(this, errorCallback);

                    return this.onSuccess = function () {
                        if (isFunction(successCallback)) {
                            resolveCallback = successCallback;

                            return new Promise(function (res, rej) {

                                promiseReturn = [res, successCallback];

                                if (status === PromiseStates.resolved) {

                                    if (resultData instanceof Promise) {
                                        resultData.then(function (result) {
                                            res(resolveCallback(result));
                                        })
                                    }
                                    else res(resolveCallback(resultData));
                                }
                            });
                        }
                    }();
                };

                var onResolve = function (val) {
                    if (status === PromiseStates.pending) {
                        resultData = val;
                        status = PromiseStates.resolved;

                        if (resolveCallback) {
                            var thenResult = resolveCallback(resultData);

                            if (promiseReturn) {
                                //  var thenResult = promiseReturn[1](resultData);

                                if (thenResult instanceof Promise) {
                                    thenResult.then(function (res) {
                                        promiseReturn[0](res);
                                    })
                                } else {
                                    promiseReturn[0](thenResult);
                                }
                            }
                        }
                        else if (finallyReturn) {
                            var finallyRes = finallyReturn[1]();

                            if (finallyRes instanceof Promise) {
                                finallyRes.then(function (result) {
                                    finallyReturn[0](result);
                                });
                            }
                            else finallyReturn[0](resultData);
                        }

                        else if (doneReturn){
                            doneReturn(resultData);
                        }
                    }
                }

                var onReject = function (val) {
                    if (status === PromiseStates.pending) {
                        resultData = val;
                        status = PromiseStates.rejected;

                        if (rejectCallback) {

                            var thenResult = rejectCallback(resultData);

                            if (promiseRejReturn) {

                                if (thenResult instanceof Promise) {
                                    thenResult.then(function (res) {
                                        promiseRejReturn[0](res);
                                    })
                                } else {
                                    promiseRejReturn[0](thenResult);
                                }
                            }
                        }
                        else if (finallyReturn) {
                            var finallyRes = finallyReturn[1]();

                            if (finallyRes instanceof Promise) {
                                finallyRes.then(function (result) {
                                    finallyReturn[0](result);
                                });
                            }
                            else refinallyReturn[0](resultData);
                        }
                        else if (doneReturn){
                            doneReturn(resultData);
                        }
                    }
                }

                this.done = onDone;
                this['finally'] = onFinally;
                this.then = onThen;
                this['catch'] = onCatch;

                try {
                    pendingRequest(onResolve, onReject);
                } catch (err) {
                    onReject(err);
                }

                return this;
            }
            else {
                throw new Error('Promise parameter is not a function.');
            }
        }

        Promise.resolve = function (val) {
            return new Promise(function (res) {
                res(val);
            })
        }

        Promise.reject = function (val) {
            return new Promise(function (res, rej) {
                rej(val);
            })
        }

        Promise.race = function (promArray) {

            if (isArray(promArray)) {

                var errorItem = null;
                var len = promArray.length;
                var resultItem = null;
                var resolvePromise = null;

                var onThenItem = function (promiseThen, stopLoop) {

                    return promiseThen.then(function (result) {
                        resultItem = result;

                        if (firstDone) {
                            firstDone(resultItem);
                        }

                        stopLoop();
                    }, function (err) {
                        errorItem = err;
                        if (firstDone) firstDone(null, err);
                        stopLoop();
                    })
                }

                for (var i = 0; i < len; i++) {
                    var promiseItem = promArray[i];

                    var stopLoop = function () {
                        i = len;
                    }

                    if (isObject(promiseItem) && isFunction(promiseItem.then)) {
                        onThenItem(promiseItem, stopLoop);
                    }
                    else if (!isFunction(promiseItem)) {
                        onThenItem(Promise.resolve(promiseItem), stopLoop);
                    }
                }

                var firstDone = function (result, isError) {
                    if (isError) {
                        if (resolvePromise) {
                            resolvePromise[1](isError);
                        }
                    }
                    else {
                        if (resolvePromise) {
                            resolvePromise[0](result);
                        }
                    }
                    resolvePromise = null;
                }

                if (errorItem || resultItem !== null) {
                    if (errorItem) return Promise.reject(errorItem);
                    else return Promise.resolve(resultItem);
                }
                else {
                    return new Promise(function (resolve, reject) {
                        resolvePromise = [resolve, reject];
                    });
                }
            }
            else {
                throw new Error('Promise.race parameter have to be an array.');
            }
        }

        Promise.all = function (promArray) {

            if (isArray(promArray)) {

                var fastError = null;
                var len = promArray.length;
                var reqCounter = promArray.length;
                var resultArray = new Array(len);
                var resolvePromise = null;

                var onThenItem = function (promiseThen, index, i) {
                    return promiseThen.then(function (result) {
                        reqCounter--;
                        resultArray[index] = result;

                        if (reqCounter == 0 && allDone) {
                            allDone(resultArray);
                        }
                    }, function (err) {
                        if (allDone) allDone(null, err);
                        fastError = err;
                        i = len;
                    })
                }

                for (var i = 0; i < len; i++) {
                    var promiseItem = promArray[i];

                    if (isObject(promiseItem) && isFunction(promiseItem.then)) {
                        (function (index) {
                            return onThenItem(promiseItem, index, i);
                        })(i);
                    }
                    else if (!isFunction(promiseItem)) {
                        (function (index) {
                            return onThenItem(Promise.resolve(promiseItem), index, i);
                        })(i);
                    }
                }

                var allDone = function (resultArray, isError) {
                    if (isError) {
                        resolvePromise[1](isError);
                    }
                    else {
                        resolvePromise[0](resultArray);
                    }
                }

                if (fastError || reqCounter === 0) {
                    if (fastError) return Promise.reject(fastError);
                    else return Promise.resolve(resultArray);
                }
                else {
                    return new Promise(function (resolve, reject) {
                        resolvePromise = [resolve, reject];
                    });
                }
            }
            else {
                throw new Error('Promise.all parameter have to be an array.');
            }
        }

        globalObject.Promise = Promise
    }
})(this || window);