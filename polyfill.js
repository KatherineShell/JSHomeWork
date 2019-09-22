'use strict';

(function (globalObject) {

    if (1 || globalObject && !globalObject.Promise) {

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

        var queque = [];

        var onPopArray = function (name) {
            var item;

            for (let i = 0, len = queque.length; i < len; i++) {
                var shifted = queque.shift();

                if (name === shifted.name || shifted.name === 'finally' || shifted.name === 'done') {
                    item = shifted;
                    i = len;
                }
            }

            return item;
        }

        function Promise(pendingRequest) {

            if (isFunction(pendingRequest)) {

                var onPushArray = function (name, callback, resolve, reject) {
                    queque.push({ name: name, callback: callback, resolve: resolve, reject: reject });
                }
                var status = PromiseStates.pending;
                var resultData = null;
                var promiseReturn = null;
                var finallyReturn = null;
                var doneReturn = null;
                var promiseRejReturn = null;

                var onDone = function (doneCalback) {
                    if (isFunction(doneCalback)) {
                        if (status === PromiseStates.pending) onPushArray('done', doneCalback);

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

                        return new Promise(function (res, rej) {
                            if (status === PromiseStates.pending) onPushArray('finally', finallyCalback, res, rej);

                            finallyReturn = [res, finallyCalback, rej];
                            if (status !== PromiseStates.pending) {

                                var finallyResult = finallyCalback();
                                var throwRequest = status === PromiseStates.resolved ? res : rej;

                                if (finallyResult instanceof Promise) {
                                    finallyResult.then(function (result) {
                                        throwRequest(result);
                                    });
                                }
                                else throwRequest(resultData);
                            }
                        });
                    }
                }

                var onReturn = function (callback, onReturning, newStatus) {
                    return new Promise(function (res, rej) {

                        onReturning(res);
                        if (status === PromiseStates.pending) onPushArray(newStatus, callback, res);

                        if (status === newStatus) {
                            var callbackData = callback(resultData);

                            if (callbackData instanceof Promise) {
                                callbackData.then(function (result) {
                                    res(callback(result));
                                });
                            }
                            else res(callback(resultData));
                        }
                        else {
                            if (status === PromiseStates.resolved) res(resultData);
                            if (status === PromiseStates.rejected) rej(resultData);
                        }
                    });
                }

                var onCatch = function (errorCallback) {
                    return this.onFail = function () {

                        if (isFunction(errorCallback)) {

                            var onReturning = function (res) {
                                promiseRejReturn = [res, errorCallback];
                            }

                            return onReturn(errorCallback, onReturning, PromiseStates.rejected);
                        }
                    }();
                };

                var onThen = function (successCallback, errorCallback) {
                    if (errorCallback) onCatch.call(this, errorCallback);

                    return this.onSuccess = function () {
                        if (isFunction(successCallback)) {

                            var onReturning = function (res) {
                                promiseReturn = [res, successCallback];
                            }

                            return onReturn(successCallback, onReturning, PromiseStates.resolved);
                        }
                    }();
                };

                var hocResolveReject = function (newStatus, value, onResult) {
                    if (status === PromiseStates.pending) {
                        resultData = value;
                        status = newStatus;

                        var nextRequest = queque.shift();

                        if (finallyReturn) {
                            var finallyRes = finallyReturn[1]();
                            var throwRequest = newStatus === PromiseStates.resolved ? finallyReturn[0] : finallyReturn[2];

                            if (finallyRes instanceof Promise) {
                                finallyRes.then(function (result) {
                                    throwRequest(result);
                                });
                            }
                            else throwRequest(resultData);
                        }
                        else if (doneReturn) {
                            doneReturn(resultData);
                        }
                        else if (onResult) {
                            var thenResult = onResult[1](resultData);

                            if (thenResult instanceof Promise) {
                                thenResult.then(function (res) {
                                    onResult[0](res);
                                })
                            } else {
                                onResult[0](thenResult);
                            }
                        }
                        else if (nextRequest) {
                            if (nextRequest.name === newStatus || nextRequest.name === 'done' || nextRequest.name === 'finally') {
                                var isFinally = nextRequest.name === 'finally';
                                var isDone = nextRequest.name === 'done';
                                var thenResult = nextRequest.callback(isFinally ? null : resultData);
                                var trowAction;
                                if (!isDone) {
                                    trowAction = isFinally && newStatus === PromiseStates.rejected ? nextRequest.reject : nextRequest.resolve;
                                }

                                if (thenResult instanceof Promise) {
                                    thenResult.then(function (res) {
                                        trowAction && trowAction(res);
                                    })
                                } else {
                                    trowAction && trowAction(thenResult);
                                }
                            }
                            else {
                                nextRequest = onPopArray(newStatus);
                                if (nextRequest) {
                                    var isFinally = nextRequest.name === 'finally';
                                    var throwRequest = isFinally && newStatus === PromiseStates.rejected ?
                                        nextRequest.reject : nextRequest.resolve;

                                    if (nextRequest) {
                                        var thenResult = nextRequest.callback(isFinally ? null : resultData);

                                        if (thenResult instanceof Promise) {
                                            thenResult.then(function (res) {
                                                throwRequest && throwRequest(res);
                                            })
                                        } else {
                                            throwRequest && throwRequest(isFinally ? resultData : thenResult);
                                        }
                                    }
                                }
                            }
                        }

                    }
                }

                var onResolve = function (val) {
                    hocResolveReject(PromiseStates.resolved, val, promiseReturn);
                }

                var onReject = function (val) {
                    hocResolveReject(PromiseStates.rejected, val, promiseRejReturn);
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

                var stopLoop = function () {
                    i = len;
                }

                for (var i = 0; i < len; i++) {
                    var promiseItem = promArray[i];


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

        globalObject.PPromise = Promise
    }
})(this || window);