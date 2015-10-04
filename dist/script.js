///<reference path="../../typings/tsd.d.ts"/>
var Lib;
(function (Lib) {
    var Graph = (function () {
        function Graph(selector) {
            this.maxPerCircle = 6;
            this.innerCircle = 150;
            this.circleSize = 170;
            this.outerCircle = 320;
            this.data = {
                labelMap: {},
                pictureMap: {},
                pictureLinkMap: {},
                nodes: [],
                links: []
            };
            this.svg = d3.select(selector);
            var n = document.querySelector(selector);
            this.width = n.clientWidth;
            this.height = n.clientHeight;
            this.svg.attr("width", this.width);
            this.svg.attr('height', this.height);
            this.force = d3.layout.force()
                .gravity(.1)
                .linkStrength(.1)
                .friction(.8)
                .theta(.5)
                .linkDistance(0)
                .size([this.width, this.height]);
            var node = this.svg.selectAll(".node");
            var link = this.svg.selectAll(".link");
            this.svg.append('circle')
                .attr('cx', window.innerWidth / 2)
                .attr('cy', window.innerHeight / 2)
                .attr('r', this.circleSize)
                .attr('class', 'middle');
            this.svg.append('circle')
                .attr('cx', window.innerWidth / 2)
                .attr('cy', window.innerHeight / 2)
                .attr('r', this.innerCircle)
                .attr('class', 'middle');
            this.svg.append('circle')
                .attr('cx', window.innerWidth / 2)
                .attr('cy', window.innerHeight / 2)
                .attr('r', this.outerCircle)
                .attr('class', 'middle');
        }
        Graph.prototype.setPictures = function (data) {
            this.pictures = data;
            this.redraw();
        };
        Graph.prototype.update = function (picture, label) {
            var realPicture = this.data.pictureMap[picture];
            var realLabel = this.data.labelMap[label];
            var previousLabel = this.data.links[this.data.pictureLinkMap[picture]].source.label;
            if (previousLabel === null)
                return;
            this.data.links[this.data.pictureLinkMap[picture]].source = realPicture;
            this.data.links[this.data.pictureLinkMap[picture]].target = realLabel;
            this.force.links(this.data.links).start();
            var link = this.svg.selectAll(".link");
            link.data(this.data.links)
                .enter()
                .insert('line', '.node')
                .attr('class', 'link');
            setTimeout(function () {
                $(".drawingMiddle img").attr("src", "/img/img/" + picture + ".jpg");
                $(".drawingMiddle .newCategoryText").text("new Label: " + Util.LabelUtil.labels[label]);
                log.debug('Graph.update', 'move', picture, previousLabel, '=>', label);
                log.text('Graph.update', 'adding class shown');
                $(".drawingMiddle").addClass("shown");
                setTimeout(function () {
                    log.text('Graph.update', 'removing class shown');
                    $(".drawingMiddle").removeClass("shown");
                }, 1000);
            }, 500);
        };
        Graph.prototype.getLabelPointCoordinates = function (p) {
            var circleSize = this.circleSize;
            var percentage = p.label / this.labelNum;
            if (p.label >= this.maxPerCircle) {
                circleSize = this.outerCircle;
                percentage = p.label / (this.labelNum - this.maxPerCircle + 1) + .125 * Math.PI;
            }
            else if (this.labelNum >= this.maxPerCircle) {
                percentage = p.label / this.maxPerCircle;
            }
            // preprocess
            percentage -= Math.PI / 2;
            return {
                x: Math.cos(percentage * Math.PI * 2) * circleSize + window.innerWidth / 2,
                y: Math.sin(percentage * Math.PI * 2) * circleSize + window.innerHeight / 2
            };
        };
        Graph.prototype.redraw = function () {
            var _this = this;
            // pictures added
            var _picturesAdded = [];
            // labels added
            var _labelsAdded = [];
            // label map: map of labels to node ids
            var colors = d3.scale.category10();
            this.pictures.forEach(function (d) {
                if (_labelsAdded.indexOf(d.label) === -1) {
                    _this.data.labelMap[d.label] = _this.data.nodes.length;
                    _this.data.nodes.push({ name: d.label.toString(), label: _labelsAdded.length, parent: null, color: colors(d.label) });
                    _labelsAdded.push(d.label);
                }
                if (_picturesAdded.indexOf(d.id) === -1) {
                    _this.data.pictureMap[d.id] = _this.data.nodes.length;
                    _this.data.nodes.push({ name: d.id.toString(), label: null, parent: null, parentLabel: _this.data.labelMap[d.label], color: colors(d.label) });
                    _picturesAdded.push(d.id);
                }
                _this.data.pictureLinkMap[d.id] = _picturesAdded.length - 1;
                _this.data.links.push({ source: _this.data.labelMap[d.label], target: _this.data.pictureMap[d.id], color: colors(d.label) });
            });
            this.labelNum = _labelsAdded.length - 1;
            this.force
                .nodes(this.data.nodes)
                .links(this.data.links)
                .start();
            var link = this.svg.selectAll(".link")
                .data(this.data.links)
                .enter().append("line")
                .attr("class", "link")
                .style('stroke', function (d) { return d.color; });
            var node = this.svg.selectAll(".node")
                .data(this.data.nodes)
                .enter().append("circle")
                .attr("class", function (d) { return d.label !== null ? 'node label' : 'node'; })
                .attr("r", function (d) { return d.label !== null ? 15 : 4; })
                .style('stroke', function (d) { return d.color; })
                .call(this.force.drag);
            node.append("title")
                .text(function (d) { return d.name; });
            this.force.on("tick", function () {
                link.attr("x1", function (d) { return d.source.x; })
                    .attr("y1", function (d) { return d.source.y; })
                    .attr("x2", function (d) { return d.target.x; })
                    .attr("y2", function (d) { return d.target.y; });
                node.attr("cx", function (d) {
                    if (d.label !== null) {
                        d.x = _this.getLabelPointCoordinates(d).x;
                    } /* else if (this.isInCircle({x: d.x, y: d.y})) {
                     var parentX = this.getLabelPointCoordinates(<IPicturePoint>nodes[d.parentLabel]).x;
                     if(d.x > parentX) {d.x -= Math.abs(d.y - parentX) * 2} else {d.x += Math.abs(d.y - parentX)}
                     } */
                    return d.x;
                })
                    .attr("cy", function (d) {
                    if (d.label !== null) {
                        d.y = _this.getLabelPointCoordinates(d).y;
                    } /*else if (this.isInCircle({x: d.x, y: d.y})) {
                     var parentY = this.getLabelPointCoordinates(<IPicturePoint>nodes[d.parentLabel]).y;
                     if(d.y > parentY) {d.y -= Math.abs(d.y - parentY) * 2} else {d.y += Math.abs(d.y - parentY)};
                     } */
                    return d.y;
                });
            });
        };
        return Graph;
    })();
    Lib.Graph = Graph;
})(Lib || (Lib = {}));

///<reference path="../../typings/tsd.d.ts"/>
var Lib;
(function (Lib) {
    var Cards = (function () {
        function Cards(config) {
            var _this = this;
            this.items = [];
            this.correctCallbacks = [];
            this.incorrectCallbacks = [];
            this.firebase = null;
            if (isNaN(Util.HashUtil.getHashNum())) {
                throw "The hash provided must be number";
            }
            this.firebase = new Firebase('https://boiling-heat-2521.firebaseio.com/swiped');
            this.firebase.authWithCustomToken('eoyakpIFmf4LTm6JcUPElixc8ieeQujvDF7bCGNh', function () { });
            this.config = $.extend(true, {}, Cards.DEFAULTCONFIG, config);
            log.debug('Cards', 'config', this.config);
            $(this.config.wrapper).find(this.config.like).on('click', function () {
                log.debug('Cards', 'like click');
                _this.like();
            });
            $(this.config.wrapper).find(this.config.dislike).on('click', function () {
                log.debug('Cards', 'like dislike');
                _this.dislike();
            });
            this.$image = $(this.config.wrapper).find(this.config.image);
            var hammer = new Hammer.Manager($('body')[0]);
            hammer.add(new Hammer.Swipe({
                velocity: .00001,
                distance: .0625
            }));
            hammer.on('swipeleft', function () {
                log.debug('Cards', 'dislike swipe');
                _this.dislike();
            });
            hammer.on('swiperight', function () {
                log.debug('Cards', 'like swipe');
                _this.like();
            });
        }
        /**
         * Likes the current image
         */
        Cards.prototype.like = function () {
            var _this = this;
            log.info('Cards', 'like');
            this.sendAnswer({
                picture_id: this.items[0].id,
                label: this.items[0].label,
                is_label: true
            });
            this.items.splice(0, 1);
            this.$image.addClass(this.config.likeClass);
            log.text('Cards', 'adding Class', this.config.likeClass);
            setTimeout(function () {
                _this.$image.removeClass(_this.config.likeClass);
                log.text('Cards', 'removing Class', _this.config.likeClass);
                _this.update();
                _this.$image.addClass(_this.config.appearingClass);
                log.text('Cards', ' adding Class', _this.config.appearingClass);
                setTimeout(function () {
                    _this.$image.removeClass(_this.config.appearingClass);
                    log.text('Cards', 'removing Class', _this.config.appearingClass);
                }, _this.config.appearingAnimationLength);
            }, this.config.likeAnimationLength);
        };
        /**
         * Dislikes the current image
         */
        Cards.prototype.dislike = function () {
            var _this = this;
            this.sendAnswer({
                picture_id: this.items[0].id,
                label: this.items[0].label,
                is_label: true
            });
            this.items.splice(0, 1);
            this.$image.addClass(this.config.dislikeClass);
            log.text('Cards', 'adding Class', this.config.dislikeClass);
            setTimeout(function () {
                _this.$image.removeClass(_this.config.dislikeClass);
                log.text('Cards', 'removing Class', _this.config.dislikeClass);
                _this.update();
                _this.$image.addClass(_this.config.appearingClass);
                log.text('Cards', ' adding Class', _this.config.appearingClass);
                setTimeout(function () {
                    _this.$image.removeClass(_this.config.appearingClass);
                    log.text('Cards', 'removing Class', _this.config.appearingClass);
                }, _this.config.appearingAnimationLength);
            }, this.config.likeAnimationLength);
        };
        /**
         * Sends answer to the service
         */
        Cards.prototype.sendAnswer = function (answer) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                answer.user_id = Util.HashUtil.getHashNum();
                log.debug('Cards.sendAnswer', answer);
                _this.firebase.push(answer, function (err) {
                    if (err)
                        reject(err);
                    resolve();
                });
                /*// TODO have real implementation here
                if(Math.random() > .5) {
                    // correct
                    this.executeCorrect();
                } else {
                    this.executeIncorrect();
                }

                // TODO implement
                reject();*/
            });
        };
        Cards.prototype.setItems = function (items) {
            this.items = items;
        };
        Cards.prototype.update = function () {
            var url;
            if (this.items.length === 0) {
                url = 'http://placehold.it/200x200?text=No%20more%20images';
            }
            else {
                url = '/img/img/' + this.items[0].id + '.jpg';
            }
            log.info('Cards', 'update', url);
            $(this.config.wrapper).find(this.config.name).text(Util.LabelUtil.labels[this.items[0].label]);
            $(this.config.wrapper).find(this.config.image).attr('style', 'background-image: url(' + url + ')');
        };
        Cards.prototype.onCorrect = function (callback) {
            this.correctCallbacks.push(callback);
        };
        Cards.prototype.onIncorrect = function (callback) {
            this.incorrectCallbacks.push(callback);
        };
        Cards.prototype.executeCorrect = function () {
            this.correctCallbacks.forEach(function (callback) {
                callback();
            });
        };
        Cards.prototype.executeIncorrect = function () {
            this.incorrectCallbacks.forEach(function (callback) {
                callback();
            });
        };
        Cards.DEFAULTCONFIG = {
            wrapper: '',
            like: '.like-button',
            dislike: '.dislike-button',
            image: '.swipe_image',
            likeClass: 'like',
            dislikeClass: 'dislike',
            appearingClass: 'appearing',
            likeAnimationLength: 1000,
            appearingAnimationLength: 1000,
            name: '.js-label'
        };
        return Cards;
    })();
    Lib.Cards = Cards;
})(Lib || (Lib = {}));

/**
 *                       _
 *                      | |
 *    _____   _____ _ __| | __ _ _   _ _ __
 *   / _ \ \ / / _ \ '__| |/ _` | | | | '__|
 *  | (_) \ V /  __/ |  | | (_| | |_| | |
 *   \___/ \_/ \___|_|  |_|\__,_|\__, |_|
 *                                __/ |
 *                               |___/
 *
 * @file      Provides the saver
 * @author    Johannes Hertenstein <j6s@thej6s.com>, overlayr
 * @copyright 2015 overlayr, all rights reserved
 **/
/// <reference path="../../typings/tsd.d.ts" />
var Lib;
(function (Lib) {
    /**
     * Lib.Save: Simple Abstraction over the used storage method
     *
     * This abstraction was added to easily swap storage methods if we need.
     * Currently we are using localforage as storage method
     *
     * Lib.Save is a singleton, so you should always initialize it using the
     * Lib.Save.getInstace() function
     */
    var Save = (function () {
        /**
         * Constructor: stores the global localforage instance to this object
         */
        function Save() {
            /**
             * A localforage instance
             */
            this.localforage = null;
            this.localforage = window['localforage'];
        }
        /**
         * Gets a singleton of Lib.Save
         */
        Save.getInstance = function () {
            if (Save.instance === null) {
                Save.instance = new Save();
            }
            return Save.instance;
        };
        /**
         * Gets a given path in the storage method
         *
         * @param path
         * @returns {Promise<any>}
         */
        Save.prototype.get = function (path) {
            log.debug('Lib.Save', path);
            return this.localforage.getItem(path);
        };
        /**
         * Sets a given path in the storage method
         *
         * @param path
         * @param content
         * @returns {Promise<any>}
         */
        Save.prototype.set = function (path, content) {
            log.info('Lib.Save', path, content);
            return this.localforage.setItem(path, content);
        };
        /**
         * Checks if a given path is set in the storage method
         *
         * @param path
         * @returns {Promise}
         */
        Save.prototype.has = function (path) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.localforage.keys(function (err, keys) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(keys.indexOf(path) !== -1);
                });
            });
        };
        /**
         * Removes a given path from the storage method
         *
         * @param path
         */
        Save.prototype.remove = function (path) {
            var _this = this;
            return new Promise(function (resolve) {
                _this.localforage.removeItem(path).then(function () {
                    resolve();
                });
            });
        };
        /**
         * A instance of Lib.Save
         */
        Save.instance = null;
        return Save;
    })();
    Lib.Save = Save;
})(Lib || (Lib = {}));

/**
 *                       _
 *                      | |
 *    _____   _____ _ __| | __ _ _   _ _ __
 *   / _ \ \ / / _ \ '__| |/ _` | | | | '__|
 *  | (_) \ V /  __/ |  | | (_| | |_| | |
 *   \___/ \_/ \___|_|  |_|\__,_|\__, |_|
 *                                __/ |
 *                               |___/
 *
 * @file      Provides the logger
 * @author    Johannes Hertenstein <j6s@thej6s.com>, overlayr
 * @copyright 2015 overlayr, all rights reserved
 **/
/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="./Save" />
var Lib;
(function (Lib) {
    /**
     * Logger: Simple abstraction over console.log adding different logging levels
     * and a means to disable logging
     */
    var Logger = (function () {
        /**
         * Constructor: Loads the current logging level if set
         *
         * @param name  The name of the identifier in storage
         */
        function Logger(name) {
            var _this = this;
            if (name === void 0) { name = "debug"; }
            /**
             * The name of the current logger.
             * The selected logging level will be saved in indexdb using this as identifier
             */
            this.name = null;
            /**
             * The logging level selected by the current user
             */
            this.level = 99;
            /**
             * These are our logging levels
             */
            this.TEXT = 10;
            this.DEBUG = 20;
            this.INFO = 30;
            this.WARNING = 40;
            this.ERROR = 50;
            this.FATAL = 60;
            /**
             * Here we configure the text that will get prepended to the logging messages
             * indicating the loging level as well as the style to be used.
             */
            this.levels = {
                'TEXT': {
                    'text': 'text    ',
                    'style': 'background: #fff; color: #999;'
                },
                'DEBUG': {
                    'text': 'debug   ',
                    'style': 'background: #fff; color: #000;'
                },
                'INFO': {
                    'text': 'INFO    ',
                    'style': 'background: #ddd; color: #00f;'
                },
                'WARNING': {
                    'text': 'WARNING ',
                    'style': 'background: #e92; color: #fff;'
                },
                'ERROR': {
                    'text': '   ERROR   ',
                    'style': 'background: #f33; color: #ddd;'
                },
                'FATAL': {
                    'text': '     FATAL     ',
                    'style': 'background: #f00; color: #fff;'
                }
            };
            this.name = name;
            this.debug('Lib.Logger', 'constructor', name);
            Lib.Save.getInstance().has(this.name).then(function (has) {
                _this.debug('Lib.Logger', 'loading level', _this.name, 'exists', has);
                var promises = [];
                if (!has) {
                    promises.push(Lib.Save.getInstance().set(_this.name, 99));
                }
                Promise.all(promises).then(function () {
                    Lib.Save.getInstance().get(_this.name).then(function (level) {
                        _this.info('Lib.Logger', 'loading level', level);
                        _this.level = level;
                    });
                });
            });
        }
        /**
         * sets the logging level
         *
         * @param level     The desired level
         */
        Logger.prototype.set = function (level) {
            this.level = level;
            Lib.Save.getInstance().set(this.name, level);
        };
        /**
         * General logging class.
         * Logs a message with the fiven level
         *
         * @param level     The logging level
         * @param args      All the arguments after the level
         */
        Logger.prototype.log = function (level) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (level < this.level) {
                return;
            }
            for (var levelname in this.levels) {
                if (level <= this[levelname]) {
                    args.unshift('%c ' + this.name + ' ' + this.levels[levelname].text, this.levels[levelname].style);
                    break;
                }
            }
            if (level > this.ERROR) {
                console.error.apply(console, args);
            }
            else if (level > this.WARNING) {
                console.warn.apply(console, args);
            }
            else {
                console.log.apply(console, args);
            }
        };
        /**
         * Logs any number of arguments with the log level TEXT
         */
        Logger.prototype.text = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            args.unshift(this.TEXT);
            this.log.apply(this, args);
        };
        /**
         * Logs any number of arguments with the log level DEBUG
         */
        Logger.prototype.debug = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            args.unshift(this.DEBUG);
            this.log.apply(this, args);
        };
        /**
         * Logs any number of arguments with the log level INFO
         */
        Logger.prototype.info = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            args.unshift(this.INFO);
            this.log.apply(this, args);
        };
        /**
         * Logs any number of arguments with the log level WARNING
         */
        Logger.prototype.warning = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            args.unshift(this.WARNING);
            this.log.apply(this, args);
        };
        /**
         * Logs any number of arguments with the log level ERROR
         */
        Logger.prototype.error = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            args.unshift(this.ERROR);
            this.log.apply(this, args);
        };
        /**
         * Log sany number of arguments with the log level FATAL
         */
        Logger.prototype.fatal = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            args.unshift(this.FATAL);
            this.log.apply(this, args);
        };
        /**
         * Prints a small demo of all available log levels
         */
        Logger.prototype.demo = function () {
            var level = this.level;
            this.level = this.TEXT;
            this.text('text');
            this.debug('debug');
            this.info('info');
            this.warning('warning');
            this.error('error');
            this.fatal('fatal');
            this.level = level;
        };
        return Logger;
    })();
    Lib.Logger = Logger;
})(Lib || (Lib = {}));

var Lib;
(function (Lib) {
    var Leveling = (function () {
        function Leveling(cards, config) {
            var _this = this;
            if (config === void 0) { config = {}; }
            this.points = 0;
            this.ether = 0;
            this.nextEther = 1;
            this.nextPoints = Math.round(Math.random() * 2);
            Util.FirebaseUtil.getFirebase('score').then(function (firebase) {
                firebase.on('value', function (value) {
                    var score = value.val()[Util.HashUtil.getHashNum()];
                    log.info('Leveling', 'score received', score);
                    if (score !== null) {
                        _this.nextEther = Math.abs(_this.ether - score.ether);
                        _this.nextPoints = Math.abs(_this.points - score.exp);
                        var nextEther = document.getElementById('next-ether');
                        var nextPoints = document.getElementById('next-points');
                        var currentEther = document.getElementById('ether');
                        var currentPoints = document.getElementById('points');
                        nextEther.innerHTML = _this.nextEther.toString();
                        nextPoints.innerHTML = _this.nextPoints.toString();
                        nextPoints.classList.add('active');
                        nextEther.classList.add('active');
                        // lets do some animation at 7.25 am ;)
                        var delay = 90;
                        var distance = 180;
                        // 1.5 sec is needed for the css animation
                        setTimeout(function () {
                            _this.ether = score.ether;
                            _this.points = score.exp;
                            _this.update();
                            nextPoints.classList.add('invisible');
                            nextEther.classList.add('invisible');
                            nextPoints.classList.remove('active');
                            nextEther.classList.remove('active');
                            setTimeout(function () {
                                nextPoints.classList.remove('invisible');
                                nextEther.classList.remove('invisible');
                            }, 1500);
                        }, 1500);
                    }
                });
            });
            this.cards = cards;
            this.config = $.extend(true, {}, Leveling.DEFAULTCONFIG, config);
            Lib.Save.getInstance().has('points').then(function () {
                Lib.Save.getInstance().get('points').then(function (points) {
                    log.debug('Leveling', 'loading points', points);
                    if (points === null)
                        return;
                    _this.points = points;
                    _this.update();
                });
            });
            Lib.Save.getInstance().has('ether').then(function (has) {
                Lib.Save.getInstance().get('ether').then(function (ether) {
                    log.debug('Leveling', 'loading ether', ether);
                    if (ether === null)
                        return;
                    _this.ether = ether;
                    _this.update();
                });
            });
            this.cards.onCorrect(function () { _this.correct(); });
            this.cards.onIncorrect(function () { _this.incorrect(); });
            this.update();
        }
        Leveling.prototype.correct = function () {
            this.points += this.nextPoints;
            this.ether += this.nextEther;
            log.info('Leveling', 'correct', this.points);
            this.persist();
            this.update();
        };
        Leveling.prototype.incorrect = function () {
            this.points -= this.nextPoints;
            this.ether -= this.nextEther;
            log.info('Leveling', 'incorrect', this.points);
            this.persist();
            this.update();
        };
        Leveling.prototype.persist = function () {
            log.info('Leveling', 'persisting', this.points, this.ether);
            Lib.Save.getInstance().set('points', this.points);
            Lib.Save.getInstance().set('ether', this.ether);
        };
        Leveling.prototype.getCurrentLevel = function () {
            for (var i = 0; i < Leveling.level.length; i++) {
                if (Leveling.level[i].pointThreshold > this.points) {
                    return Leveling.level[i - 1];
                }
            }
        };
        Leveling.prototype.update = function () {
            var template = Handlebars.compile(this.config.levelTemplate);
            var content = template({
                points: this.points,
                level: this.getCurrentLevel()
            });
            $(this.config.level).html(content);
            $(this.config.points).html(this.points.toString());
            $(this.config.ether).html(this.ether.toString());
            this.nextEther = Math.round(Math.random() * 2);
            $(this.config.nextEther).html(this.nextEther.toString());
            $(this.config.nextPoints).html(this.nextPoints.toString());
        };
        Leveling.DEFAULTCONFIG = {
            level: '.level',
            levelTemplate: '{{level.name}}',
            ether: '.js-ether',
            points: '.js-points',
            nextEther: '.js-nextEther',
            nextPoints: '.js-nextPoints'
        };
        Leveling.level = [
            { name: 'You suck', pointThreshold: -10 },
            { name: 'That\'s Bad', pointThreshold: -5 },
            { name: 'Uh Oh', pointThreshold: -5 },
            { name: 'First Time User', pointThreshold: 0 },
            { name: 'Beginner', pointThreshold: 10 },
            { name: 'Novice', pointThreshold: 20 },
            { name: 'Advanced', pointThreshold: 35 },
            { name: 'Pro', pointThreshold: 60 },
            { name: 'God', pointThreshold: 100 },
        ];
        return Leveling;
    })();
    Lib.Leveling = Leveling;
})(Lib || (Lib = {}));

var Util;
(function (Util) {
    var FirebaseUtil = (function () {
        function FirebaseUtil() {
        }
        FirebaseUtil.getFirebase = function (url) {
            return new Promise(function (resolve) {
                var firebase = new Firebase(FirebaseUtil.baseUrl + url);
                firebase.authWithCustomToken(FirebaseUtil.secrect, function () {
                    resolve(firebase);
                });
            });
        };
        FirebaseUtil.secrect = "eoyakpIFmf4LTm6JcUPElixc8ieeQujvDF7bCGNh";
        FirebaseUtil.baseUrl = "https://boiling-heat-2521.firebaseio.com/";
        return FirebaseUtil;
    })();
    Util.FirebaseUtil = FirebaseUtil;
})(Util || (Util = {}));

///<reference path="Lib/Graph"/>
///<reference path="Lib/Cards"/>
///<reference path="Lib/Logger"/>
///<reference path="Lib/Leveling"/>
///<reference path="Util/FirebaseUtil"/>
var log = new Lib.Logger('labelforce');
if (window['view'] === 'index') {
    Util.FirebaseUtil.getFirebase('net').then(function (firebase) {
        var graph = new Lib.Graph('#drawing_area');
        firebase.once('value', function (value) {
            log.debug('VALUE', value.val());
            var datas = value.val();
            var data = [];
            var ids = [];
            for (var j in datas) {
                var prefixedId = Object.keys(datas[j])[0];
                if (ids.indexOf(prefixedId) > -1) {
                    continue;
                }
                ids.push(prefixedId);
                data.push({
                    id: parseInt(prefixedId.substr(1)),
                    label: datas[j][prefixedId]
                });
            }
            graph.setPictures(data);
            var check = false;
            firebase.on('child_added', function (value) {
                if (check) {
                    var v = value.val();
                    var prefixedId = Object.keys(v)[0];
                    log.debug(v);
                    graph.update(parseInt(prefixedId.substr(1)), v[prefixedId]);
                }
            });
            setTimeout(function () { check = true; log.info('let the checking beginn'); }, 4000);
            if (Util.HashUtil.getHash() === 'p') {
                function fake() {
                    log.info("sending fake");
                    var rand = Math.round(Math.random() * 99) + 1;
                    var labl = Math.round(Math.random() * 8) + 1;
                    graph.update(rand, labl);
                    var offset = Math.round(Math.random() * 5000) + 500;
                    setTimeout(fake, offset);
                }
                setTimeout(fake, 1200);
            }
        });
    });
    setTimeout(function () {
        $(".intro").addClass("gone");
    }, 8000);
}
if (window['view'] === 'swipe') {
    Util.FirebaseUtil.getFirebase('labelme').then(function (firebase) {
        var cards = new Lib.Cards({
            wrapper: '.swipe'
        });
        var leveling = new Lib.Leveling(cards);
        firebase.once('value', function (value) {
            var datas = value.val();
            log.info('labelme', datas);
            var data = [];
            for (var l in datas) {
                var prefixedId = Object.keys(datas[l])[0];
                data.push({
                    id: parseInt(prefixedId.substr(1)),
                    label: datas[l][prefixedId]
                });
            }
            cards.setItems(data);
            cards.update();
            var check = false;
            firebase.on("child_added", function (item) {
                if (check) {
                    log.debug(item.val());
                }
            });
            setTimeout(function () { check = true; log.info("let the checking begin"); }, 3000);
        });
    });
}
if (window['view'] === 'app') {
    var link = $('#swipe_link').attr('href');
    link += '#' + (Math.round(Math.random() * 3)).toString();
    log.info('Changing link to', link);
    $('#swipe_link').attr('href', link);
}

var Util;
(function (Util) {
    var HashUtil = (function () {
        function HashUtil() {
        }
        HashUtil.getHash = function () {
            return window.location.hash.substr(1);
        };
        HashUtil.getHashNum = function () {
            return parseInt(HashUtil.getHash());
        };
        return HashUtil;
    })();
    Util.HashUtil = HashUtil;
})(Util || (Util = {}));

var Util;
(function (Util) {
    var LabelUtil = (function () {
        function LabelUtil() {
        }
        LabelUtil.labels = {
            6: 'frog',
            9: 'truck',
            4: 'deer',
            1: 'car',
            7: 'horse',
            8: 'ship',
            2: 'bird',
            3: 'cat',
            0: 'airplane',
            5: 'dog'
        };
        return LabelUtil;
    })();
    Util.LabelUtil = LabelUtil;
})(Util || (Util = {}));
