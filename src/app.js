const steem = require('steem');
const config = require('./config');
const steemApi = require('./steemAPI');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')
const winston = require('winston')
const fs = require('fs')
const path = require('path')
const filename = path.join(__dirname, './trail.log')
const labels = config.labels
const following = config.following
const timeout = ms => new Promise(res => setTimeout(res, ms));

steem.api.setOptions({ url: 'https://steemd.minnowsupportproject.org' })

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: filename
        })
    ]
});

const nlu = new NaturalLanguageUnderstandingV1({
    username: config.username,
    password: config.password,
    version: '2018-04-05',
    url: config.url
});

const ACC_NAME = config.accname,
    ACC_KEY = config.posting;

run();

async function run () {

    console.log("Curation Trail Bot Script Running...");

    try {
        const cashoutTime = "1969-12-31T23:59:59";

        for(var f = 0; f < config.following.length; f++){
            const followed = config.following[f];
            const followedUsername = followed.account;

            console.log("NOW CHECKING VOTES FOR", followedUsername);

            const votes = await parseVotes(followedUsername);

            for(var v = 0; v < votes.length; v++) {
                const data = votes[v];
                let weight = 0;
                const votingPower = (await getVotingPower("utopian-io"));

                console.log("CURRENT VOTING POWER", votingPower);
                if (votingPower <= 9800) {
                    break;
                }

                const getPostObj = async function () {
                    try {
                        return await steemApi.getContent(data.author, data.permlink);
                    }catch(e) {
                        console.log(e);
                        return await getPostObj();
                    }
                };

                const postObj = await getPostObj();

                if (postObj.cashout_time === cashoutTime) {
                    continue;
                }

                console.log("NOW CHECKING POST", data.permlink);

                if (data.voter !== data.author && data.voter === followed.account && data.weight >= followed.weight_trigger || (data.voter === followed.account && followed.whitelisted === true)) {
                    weight = Math.round(data.weight * followed.weight_divider);
                    weight = weight > followed.max_weight ? followed.max_weight : weight;

                    let comment = followed.comment.replace('{AUTHOR}', data.author).replace('{VOTER}', data.voter)

                    logger.log({
                        level: 'info',
                        message: `${data.voter} just voted ${data.author}/${data.permlink} by weight ${weight}`
                    });

                    console.log("VOTE IS READY TO BE STREAMED WITH WEIGHT", weight);

                    await timeout(20000);

                    await StreamVote(postObj, data.author, data.permlink, weight, comment, followed.check_context);

                    console.log('@' + data.voter + ' Just voted now!');
                }
            }
        }

        setTimeout(async function() {
            await run();
        }, 1000 * 60 * 60 * 6); // wait 6 hours

    }catch(e) {
        logger.log({
            level: 'info',
            message: `${e}`
        });

        console.log(e);

        await run();
    }
}

function getBeforeSlash(str){
    return str.substring(0, str.indexOf("/"));
}

function dateDiff(date1,date2,interval) {
    var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7;
    date1 = new Date(date1);
    date2 = new Date(date2);
    var timediff = date2 - date1;
    if (isNaN(timediff)) return NaN;
    switch (interval) {
        case "years": return date2.getFullYear() - date1.getFullYear();
        case "months": return (
            ( date2.getFullYear() * 12 + date2.getMonth() )
            -
            ( date1.getFullYear() * 12 + date1.getMonth() )
        );
        case "weeks"  : return timediff / week;
        case "days"   : return timediff / day;
        case "hours"  : return timediff / hour;
        case "minutes": return timediff / minute;
        case "seconds": return timediff / second;
        default: return undefined;
    }
}

async function parseVotes (account) {
    return new Promise((resolve, reject) => {
    const votes = Array();
    steem.api.getAccountVotes(account, async function(err, result) {
        if (!err) {
            var voted = result;
            voted = voted.sort(function(a,b){
                // Turn your strings into dates, and then subtract them
                // to get a value that is either negative, positive, or zero.
                return new Date(b.time) - new Date(a.time);
            });
            var v;
            for(v = 0; v < voted.length; v++) {
                var vote = voted[v];
                var author = getBeforeSlash(vote.authorperm);
                var tmp = vote.authorperm.split("/");
                var permlink = tmp.pop();

                console.log(vote.time);
                console.log(dateDiff(new Date(vote.time), new Date(), "days"));

                const dateSinceVote = dateDiff(new Date(vote.time), new Date(), "days");
                if (dateSinceVote > 2) {
                    console.log("OVER 2 DAYS MARK");
                    break;
                }

                if (vote.percent >= 0) {
                    votes.push({
                        weight: vote.percent,
                        author: author,
                        voter: account,
                        permlink: permlink,
                    });
                }
            }

            resolve(votes);

        } else {
            return reject(err);
        }
    });
});
}

async function getVotingPower(account) {
    const getAccountObj = async function () {
        try {
            return await steemApi.getAccounts([account]);
        }catch(e) {
            console.log(e);
            return await getAccountObj();
        }
    };

    const accountObj = (await getAccountObj())[0];

    var STEEMIT_100_PERCENT = 10000;
    var STEEMIT_VOTE_REGENERATION_SECONDS = (5 * 60 * 60 * 24);

    var voting_power = accountObj.voting_power;
    var last_vote_time = new Date((accountObj.last_vote_time) + 'Z');
    var elapsed_seconds = (new Date() - last_vote_time) / 1000;
    var regenerated_power = Math.round((STEEMIT_100_PERCENT * elapsed_seconds) / STEEMIT_VOTE_REGENERATION_SECONDS);
    var current_power = Math.min(voting_power + regenerated_power, STEEMIT_100_PERCENT);

    return current_power;
}

function hasVotedAlready (votes, voter) {
    let i;
    let hasVote = false;
    let voteWeight = 0;
    for(i = 0; i < votes.length; i++) {
        const vote = votes[i];
        if (vote.voter === voter) {
            hasVote = true;
            voteWeight = vote.weight;
            break;
        }
    }

    return {
        hasVoted: hasVote,
        voteWeight: voteWeight
    };
}

async function StreamVote(postObj, author, permalink, weight, comment, check_context) {
    try {
        var checkVote = hasVotedAlready(postObj.active_votes, "utopian-io");
        var hasVoted = checkVote.hasVoted;
        var hasVotedWithWeight = checkVote.voteWeight;

        // remove vote
        if(weight === 0 && (!hasVoted || (hasVoted && hasVotedWithWeight > 0))) {

            console.log("NOW UNVOTING");

            logger.log({
                level: 'info',
                message: `It was a unvote on ${author}/${permalink}`
            })

            const getReplies = async function () {
                try {
                    return await steemApi.getContentReplies(author, permalink);
                } catch(e) {
                    console.log(e);
                    return await getReplies();
                }
            }

            const replies = await getReplies();

            if (replies) {
                for(var reply in replies) {
                    if(replies[reply].author === ACC_NAME)
                    {
                        comment = `Unfortunately, your contribution's vote was removed,as the trailing community vote was removed.\n\nFor any inquiries, contact our support team at https://support.utopian.io/`;
                        await applyVote(ACC_KEY, ACC_NAME, author, permalink, weight, comment, replies[reply].permlink);
                    }
                }
            }
        }

        // cast vote
        if (weight > 0 && !hasVoted && postObj.body.length >= 1500 && JSON.parse(postObj.json_metadata).tags[0] !== 'utopian-io' && postObj.depth === 0) {

            console.log("NOW VOTING");

            if (check_context === true) {
                try {
                    console.log("NOW CHECKING CONTEXT FOR", postObj.permlink);
                    nlu.analyze({
                            text: postObj.body,
                            features: {
                                categories: {}
                            }
                        },
                        async function(err, response) {
                        if (err) {
                            console.log('error:', err);
                            logger.log({
                                level: 'info',
                                message: `${err} from watson`
                            })
                        }

                        if (!err && response) {
                            console.log(response);
                            var vote = false;
                            console.log('First check for labels');
                            var c;
                            logger.log({
                                level: 'info',
                                message: `${response.categories}`
                            })
                            for(c = 0; c < response.categories.length; c++) {
                                const category = response.categories[c];
                                if (labels.includes(category.label) === true && category.score >= 0.68) {
                                    vote = true;

                                }
                            }
                            console.log("IBM", response.categories);
                            console.log("SHOULD BE VOTED?", vote);

                            if (vote === true) {
                                await applyVote(ACC_KEY, ACC_NAME, author, permalink, weight, comment);
                            }
                        }
                    });
                }catch(e) {
                    console.log(e)
                }
            }

            if (check_context === false) {
                await applyVote(ACC_KEY, ACC_NAME, author, permalink, weight, comment);
            }
        }
    }catch(e) {
        logger.log({
            level: 'info',
            message: `${e}`
        });

        await StreamVote(postObj, author, permalink, weight, comment, check_context)
    }
}


async function applyVote (ACC_KEY, ACC_NAME, author, permalink, weight, comment, newpermlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase()) {

    const setVote = async function () {
        try {
            return await steemApi.vote(ACC_KEY, ACC_NAME, author, permalink, weight);
        }catch(e) {
            logger.log({
                level: 'info',
                message: `${e}`
            })
            console.log(e);
        }
    };

    const setComment = async function () {
        try {
            return await steemApi.comment(ACC_KEY, author, permalink, ACC_NAME, newpermlink, '', comment, {
                tags: ['utopian.tip'],
                app: 'utopian-io'
            });
        }catch(e) {
            logger.log({
                level: 'info',
                message: `${e}`
            })
            console.log(e);
        }
    };

    const voted = await setVote();


    if (voted) {
        logger.log({
            level: 'info',
            message: `Voted ${author}/${permalink}`
        })

        await setComment();

        logger.log({
            level: 'info',
            message: `Commented`
        })

        console.log('Voted Succesfully, permalink: ' + permalink + ', author: ' + author + ', weight: ' + weight / 100 + '%.');
    }
}
