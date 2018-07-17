const steem = require('steem');

steem.api.setOptions({ url: 'http://rpc.buildteam.io/' })

function getContent(author, permlink) {
  return new Promise((resolve, reject) => {
    steem.api.getContent(author, permlink, (e, p) => {
      if (e) return reject(e);
      resolve(p);
    });
  });
}

function getContentReplies(author, permlink) {
    return new Promise((resolve, reject) => {
            steem.api.getContentReplies(author, permlink, (e, p) => {
            if (e) return reject(e);
            resolve(p);
      });
  });
}

function getAccountHistory(account, start, limit) {
  return new Promise((resolve, reject) => {
    steem.api.getAccountHistory(account, start, limit, (e, p) => {
      if (e) return reject(e);
      resolve(p);
    });
  });
}

function getDiscussionsByBlog(query) {
  return new Promise((resolve, reject) => {
    steem.api.getDiscussionsByBlog(query, (e, props) => {
      if (e) return reject(e);
      resolve(props);
    })
  });
}

function getDynamicGlobalProperties() {
  return new Promise((resolve, reject) => {
    steem.api.getDynamicGlobalProperties((e, props) => {
      if (e) return reject(e);
      resolve(props);
    })
  });
}

function getAccounts(accounts) {
  return new Promise((resolve, reject) => {
    steem.api.getAccounts(accounts, (e, accs) => {
      if (e) return reject(e);
      resolve(accs);
    });
  });
}

function getCurrentMedianHistoryPrice() {
  return new Promise((resolve, reject) => {
    steem.api.getCurrentMedianHistoryPrice((e, price) => {
      if (e) return reject(e);
      resolve(price);
    });
  });
}

function getRewardFund() {
  return new Promise((resolve, reject) => {
    steem.api.getRewardFund('post', (e, fund) => {
      if (e) return reject(e);
      resolve(fund);
    });
  });
}

function vote(activeKey, voter, author, permlink, weight) {
  return new Promise((resolve, reject) => {
    steem.broadcast.vote(activeKey, voter, author, permlink, weight, (e, voted) => {
      if (e) return reject(e);
      resolve(voted);
    });
  });
}

function comment(activeKey, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata) {
  return new Promise((resolve, reject) => {
    steem.broadcast.comment(activeKey, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, (e, commented) => {
      if (e) return reject(e);
      resolve(commented);
    });
  });
}

module.exports = {
    getContent: getContent,
    getAccountHistory: getAccountHistory,
    getDiscussionsByBlog: getDiscussionsByBlog,
    getDynamicGlobalProperties: getDynamicGlobalProperties,
    getAccounts: getAccounts,
    getCurrentMedianHistoryPrice: getCurrentMedianHistoryPrice,
    getRewardFund: getRewardFund,
    vote: vote,
    comment: comment,
    getContentReplies: getContentReplies,
};
