const router = require('express').Router();
const { logger } = require('../../lib/logger');
const auth = require('../../middleware/check-auth');
const s3File = require('../../lib/reads3File');

router.post('/allBlockWise', auth.authController, async (req, res) => {
    try {
        logger.info('--- all blocks UDISE api ---');
        var management = req.body.management;
        var category = req.body.category;
        let fileName;

        if (management != 'overall' && category == 'overall') {
            fileName = `udise/school_management_category/overall_category/${management}/block.json`;
        } else {
            fileName = `udise/udise_block_wise.json`
        }
        let blockData = await s3File.readFileConfig(fileName);;
        var mydata = blockData.data;
        let fileMetaData = await s3File.getFileMetaData(fileName);
        logger.info('--- blocks UDISE api response sent---');
        res.status(200).send({
            data: mydata, footer: blockData.allBlocksFooter.totalSchools, fileMetaData
        });

    } catch (e) {
        logger.error(`Error :: ${e}`);
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
})

router.post('/blockWise/:distId', auth.authController, async (req, res) => {
    try {
        logger.info('--- block per district UDISE api ---');
        var management = req.body.management;
        var category = req.body.category;
        let fileName;

        if (management != 'overall' && category == 'overall') {
            fileName = `udise/school_management_category/overall_category/${management}/block.json`;
        } else {
            fileName = `udise/udise_block_wise.json`
        }
        let blockData = await s3File.readFileConfig(fileName);;
        let distId = req.params.distId

        let filterData = blockData.data.filter(obj => {
            return (obj.details.district_id == distId)
        })
        let mydata = filterData;
        let fileMetaData = await s3File.getFileMetaData(fileName);
        logger.info('--- block per dist UDISE api response sent---');
        res.status(200).send({
            data: mydata, footer: blockData.footer[`${distId}`].totalSchools, fileMetaData
        });

    } catch (e) {
        logger.error(e);
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
});

module.exports = router;