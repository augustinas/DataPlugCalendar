'use strict';

const express = require('express');
const router = express.Router();

const db = require('../services/db.service');
const hat = require('../services/hat.service');
const market = require('../services/market.service');
const update = require('../services/update.service');
const errors = require('../errors');
const config = require('../config');

router.get('/', (req, res, next) => {
  return res.render('dataPlugLanding', { hatHost: req.query.hat });
});

router.post('/hat', (req, res, next) => {
  if (!req.body['hat_url']) return next();

  req.session.hatUrl = req.body['hat_url'];

  market.connectHat(req.session.hatUrl, (err) => {

    if (err) return next();

    hat.getAccessToken(req.session.hatUrl, (err, hatAccessToken) => {

      if (err) return next();

      req.session.hatAccessToken = hatAccessToken;

      req.session.save(function (err) {
        return res.redirect('/dataplug/config');
      });
    });
  });
}, errors.renderErrorPage);

router.get('/config', (req, res, next) => {
  db.countDataSources(req.session.hatUrl, (err, count) => {
    if (err) return next();

    if (count === 0) {
      return res.render('calendarLinkForm');
    } else {
      return res.render('dataPlugStats');
    }
  });
});

router.post('/config', (req, res, next) => {
  const calendarLink = req.body['calendar-url'];

  if (!calendarLink) return res.redirect('/dataplug/config');

  db.createDataSources('events',
                       'ical',
                       req.session.hatUrl,
                       null,
                       (err, savedEntries) => {
    if (err) return next();

      db.createCalendar(calendarLink, savedEntries, (err, savedCalendar) => {
        if (err) return next();

        update.addInitJob(savedEntries[0]);
        return res.render('confirmation');
      });

  });
}, errors.renderErrorPage);

module.exports = router;
