const router = require('express').Router();
const { logger } = require('../../lib/logger');
const auth = require('../../middleware/check-auth');
const s3File = require('../../lib/reads3File');

router.post('/blockWise', auth.authController, async (req, res) => {
    try {
        logger.info('---composite report block wise api ---');
        var management = req.body.management;
        var category = req.body.category;
        let fileName;

        if (management != 'overall' && category == 'overall') {
            fileName = `composite/school_management_category/overall_category/${management}/comp_block.json`
        } else {
            fileName = `composite/comp_block.json`
        }
        let jsonData = await s3File.readFileConfig(fileName);
        let fileMetaData = await s3File.getFileMetaData(fileName);

        logger.info('--- composite report block api response sent ---');
        res.status(200).send({data: jsonData, fileMetaData});

    } catch (e) {
        logger.error(`Error :: ${e}`)
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
});

router.post('/blockWise/:distId', auth.authController, async (req, res) => {
    try {
        logger.info('---composite report blocks per district api ---');
        var management = req.body.management;
        var category = req.body.category;
        let fileName;

        if (management != 'overall' && category == 'overall') {
            fileName = `composite/school_management_category/overall_category/${management}/comp_block.json`
        } else {
            fileName = `composite/comp_block.json`
        }
        let jsonData = await s3File.readFileConfig(fileName);
        let fileMetaData = await s3File.getFileMetaData(fileName);

        let distId = req.params.distId

        let filterData = jsonData.filter(obj => {
            return (obj.district.id == distId)
        });
        if (filterData.length == 0) {
            res.status(404).json({ errMsg: "No data found" });
        } else {
            // map and extract required  values to show in the leaflet-map
            logger.info('--- composite report block per district api reponse sent ---');
            res.status(200).send({data: filterData, fileMetaData});
        }
    } catch (e) {
        logger.error(`Error :: ${e}`)
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
});

module.exports = router;