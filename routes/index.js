'use strict';
/* global process */
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved. 
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *******************************************************************************/
var express = require('express');
var router = express.Router();

// ============================================================================================================================
// Home
// ============================================================================================================================
router.route('/').get(function(req, res){
	res.redirect('/home');
});
router.route('/home').get(function(req, res){
	res.render('home', {title: 'Marbles Part 1'});
});
router.route('/buyer').get(function(req, res){
	res.render('buyer', {title: 'Marbles Part 1'});
});
router.route('/business').get(function(req, res){
	res.render('business', {title: 'Marbles Part 1'});
});
router.route('/courier').get(function(req, res){
	res.render('courier', {title: 'Marbles Part 1'});
});
module.exports = router;

