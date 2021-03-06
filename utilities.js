/**
 * Node-based utilities
 *
 * @author: hrobertking@cathmhoal.com
 *
 * @exports getCLIOpts as getOpts
 * @exports utfDecode as utfToHtml
 * @exports utfEncode as htmlToUtf
 */

var path = require('path'),
    invoked = process.argv[1].split(path.sep).pop(),
    cli = getCLIOpts(),
    translated,
    utilities = {
        'grep': {
            description: 'Searches for a translated string in the specified directory, recusively.',
            opt_short: 'g',
            opt_long: 'grep',
            run: function grep() {
                var exec = require('child_process').exec
                    cmd = 'grep --color=always "' + translated + '" ' + this.value + ' -r';

                if (translated) {
                    exec(cmd, function notify(error, stdout, stderr) {
                            if (error) {
                                console.error(error);
                            } else if (stdout) {
                                console.log(stdout);
                            } else if (stderr) {
                                console.error(stderr);
                            }
                        });
                }
            },
            value: ''
        },
        'htmlToUtf': {
            description: 'Encodes HTML entitities as a UTF string. VALUE MUST BE ENCLOSED IN DOUBLE QUOTES.',
            opt_short: 'e',
            opt_long: 'encode',
            run: function utfEncode(str) {
                var bite,
                    html = this.value || str;

                /* translate all the entities */
                translated = html.replace(/&#(\d+);/g, function(match, val) {
                    return String.fromCharCode(val);
                });

                /* display the translated string if we're using the utility */
                if (!str && !cli.q && !cli.quiet) {
                    console.log(html + ' --> ' + translated);
                }
                
                /* return the value */
                return translated;
            },
            value: ''
        },
        'utfToHtml': {
            description: 'Decodes a UTF string into HTML entities',
            opt_short: 'd',
            opt_long: 'decode',
            run: function utfDecode(str) {
                var bite,
                    utf = this.value || str;

                /* translate all the chars */
                translated = '';
                for (bite = 0; bite < utf.length; bite += 1) {
                    translated += '&#' + utf.charCodeAt(bite) + ';'
                }
                
                /* translate the spaces back to spaces */
                translated = translated.replace(/&#(32|9);/g, ' ');

                /* display the translated string if we're using the utility */
                if (!str && !cli.q && !cli.quiet) {
                    console.log(utf + ' --> ' + translated);
                }
                
                /* return the value */
                return translated;
            },
            value: ''
        }
    };

/**
 * Parses the command-line arguments passed and returns an object that contains each command-line argument as a property.
 * @returns {object}
 */
function getCLIOpts() {
    var args = process.argv,
        isfirst = true,
        arg_l,
        arg_s,
        value,
        obj = { argv:[ ] };

    /* Loop through all the options args */
    while (args.length) {
        /* delete the word 'node' if it's the first arg */
        if (/\bnode$/.test(args[0]) && isfirst) {
            args.splice(0, 1);
        }

        /* if the first arg is a js filename, it's the caller */
        if (args[0].indexOf('.js') > -1 && isfirst) {
            obj._command = args[0];
            args.splice(0, 1);
        }

        /* set long and short options */
        arg_l = /^\-{2}(\S+)/.exec(args[0]);
        arg_s = /^\-{1}(\S+)/.exec(args[0]);

        if (arg_l) {
            if (arg_l[1].indexOf(':') > -1) {
                /* we have data in the argument, e.g., --foo:bar */
                value = (arg_l[1] || '').split(':');
                obj[value[0]] = [obj[value[0]], value[1]].join(',').replace(/^\,|\,$/g, '');
                obj.argv.push(args[0]);
                args.splice(0, 1);
            } else if (arg_l[1].indexOf('=') > -1) {
                /* we have data in the argument, e.g., --foo=bar */
                value = (arg_l[1] || '').split('=');
                obj[value[0]] = [obj[value[0]], value[1]].join(',').replace(/^\,|\,$/g, '');
                obj.argv.push(args[0]);
                args.splice(0, 1);
            } else {
                /* there isn't data passed in, so set the flag to true */
                obj[arg_l[1]] = true;
                obj.argv.push(args[0]);
                args.splice(0, 1);
            }
        } else if (arg_s) {
            /* split the 'small' arg name into letters */
            arg_l = arg_s[1]; /* keep the whole argument */
            arg_s = arg_s[1].split('');

            if (arg_l.indexOf(':') > -1) {
                /* we have data in the argument, e.g., -f:bar */
                arg_s = arg_l.split(':')[0].split('');
                for (value = 0; value < arg_s.length; value += 1) {
                    if (value === arg_s.length - 1) {
                        obj[arg_s[value]] = [obj[arg_s[value]], arg_l.split(':')[1]].join(',').replace(/^\,|\,$/g, '');
                    } else {
                        obj[arg_s[value]] = true;
                    }
                }
                obj.argv.push(args[0]);
                args.splice(0, 1);
            } else if (arg_l.indexOf('=') > -1) {
                /* we have data in the argument, e.g., --foo=bar */
                arg_s = arg_l.split('=')[0].split('');
                for (value = 0; value < arg_s.length; value += 1) {
                    if (value === arg_s.length - 1) {
                        obj[arg_s[value]] = [obj[arg_s[value]], arg_l.split('=')[1]].join(',').replace(/^\,|\,$/g, '');
                    } else {
                        obj[arg_s[value]] = true;
                    }
                }
                obj.argv.push(args[0]);
                args.splice(0, 1);
            } else if (arg_s.length > 1) {
                /**
                 * if the arg is more than one letter, then loop
                 * through the letters and set each to the presented
                 * value or true
                 */
                for (value = 0; value < arg_s.length; value += 1) {
                    obj[arg_s[value]] = true;
                }
                obj.argv.push(args[0]);
                args.splice(0, 1);
            } else {
                /* there isn't data passed in, so set the flag to true */
                obj[arg_s[0]] = true;
                obj.argv.push(args[0]);
                args.splice(0, 1);
            }
        } else {
            /**
             * get the current value for the unnamed arguments
             * and add this value to it, then store the values
             * in the property of the object
             */
            value = (obj._unnamed || '').split(',');
            value.push(args[0]);
            value = value.join(',').replace(/^\,|\,$/g, '');
            if (value) {
                obj._unnamed = value;
            }
            obj.argv.push(args[0]);
            args.splice(0, 1);
        }
        isfirst = false;
    }

    return obj;
}

/**
 * Usage information
 * @returns {void}
 */
function usage() {
    var item,
        def,
        len = 0,
        params = [ ];

    /**
     * Pads a string with spaces to a minimum length
     * @return {string}
     * @param {string} value
     * @param {number} length
     * @param {string} str
     */
    function fill(value, length, str) {
        while (value.length < length) {
            value += str;
        }

        return value;
    }

    /* add non-utility parameters */
    params.push(['-h, --help', 'Show usage information']);
    params.push(['-q, --quiet', 'Suppress results']);

    /* calculate the longest parameter definition */
    for (item in utilities) {
        if (utilities.hasOwnProperty(item)) {
            /* set utility definition */
            def = ('-' + utilities[item].opt_short + ', --' + utilities[item].opt_long) + '=<value>';

            /* add the utility definition to the messages */
            params.push([def, utilities[item].description]);
        }
    }

    /* calculate length considering additional (non-utility) command-line args */
    for (item = 0; item < params.length; item += 1) {
        len = Math.max(len, params[item][0].length);
    }

    /* sort the params */
    params.sort(function(a, b) {
            return a[0] > b[0];
        });

    /* output the message */
    console.log('Syntax: ' + invoked.split(path.sep).pop() + ' <utilities>');
    console.log('');
    for (item = 0; item < params.length; item += 1) {
        console.log(fill(params[item][0], len, ' ') + ' ' + params[item][1]);
    }
    console.log('');
}

/* exported properties */
exports.getOpts = getCLIOpts;
exports.utfToHtml = utilities.utfToHtml.run;
exports.htmlToUtf = utilities.htmlToUtf.run;

/**
 * Runs the utilities as passed on the command line while delaying execution of specific utilities
 * @returns {void}
 */
function runUtilities() {
    var param,
        deList = ['g', 'grep'];

    /**
     * Runs the utility indicated by the cli parameter
     * @return {void}
     * @param {string} clp
     */
    function runUtility(clp) {
        var utility;

        /* loop through the utilities looking for a match */
        for (utility in utilities) {
            if (utilities.hasOwnProperty(utility) &&
                 (utilities[utility].opt_long === clp ||
                    utilities[utility].opt_short === clp ||
                    utility === clp)) {
                utilities[utility].value = cli[clp];
                utilities[utility].run();
                break;
            }
        }
    }

    /* loop through the command-line parameters */
    for (param in cli) {
        /* run the utility if it's not specified in the delayed execution list */
        if (deList.indexOf(param) < 0) {
            if (cli.hasOwnProperty(param)) {
                runUtility(param);
            }
        }
    }

    /* run the utility if it's specified in the delayed execution list */
    for (param = 0; param < deList.length; param += 1) {
        if (cli.hasOwnProperty(deList[param])) {
            runUtility(deList[param]);
        }
    }
}

/**
 * if no utilities are specified or if help is specified, show usage,
 * otherwise, loop through the specified utilities
 */
if (cli.h || cli.help || !cli.argv || !cli.argv.length || !cli.argv[0]) {
    usage();
} else {
    runUtilities();
}
