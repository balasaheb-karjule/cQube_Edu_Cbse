const router = require('express').Router();
var const_data = require('../../lib/config');
const { logger } = require('../../lib/logger');
const auth = require('../../middleware/check-auth');
const s3File = require('../../lib/reads3File');

router.post('/allSchoolWise', async (req, res) => {
    try {
        logger.info('---Infra all school wise api ---');
        var management = req.body.management;
        var category = req.body.category;
        let fileName;

        if (management != 'overall' && category == 'overall') {
            fileName = `infra/school_management_category/overall_category/${management}/infra_school_table.json`;
        } else {
            fileName = `infra/infra_school_table.json`
        }
        let data = await s3File.readFileConfig(fileName);
        let fileMetaData = await s3File.getFileMetaData(fileName);
        logger.info('---Infra all school wise response sent---');
        res.status(200).send({
            data,
            fileMetaData
        });

    } catch (e) {
        logger.error(`Error :: ${e}`)
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
});

router.post('/schoolWise/:distId/:blockId/:clusterId', auth.authController, async (req, res) => {
    try {
        logger.info('---Infra school per cluster api ---');
        var clusterId = req.params.clusterId;
        var management = req.body.management;
        var category = req.body.category;
        let fileName;

        if (management != 'overall' && category == 'overall') {
            fileName = `infra/school_management_category/overall_category/${management}/infra_school_table.json`;
        } else {
            fileName = `infra/infra_school_table.json`
        }
        let schoolData = await s3File.readFileConfig(fileName);

        let schoolFilterData = schoolData.filter(obj => {
            return (obj.cluster.id == clusterId)
        });
        if (schoolFilterData.length == 0) {
            res.status(404).json({ errMsg: "No data found" });
        } else {
            logger.info('---Infra school per cluster response sent---');
            let fileMetaData = await s3File.getFileMetaData(fileName);
            res.status(200).send({
                data: schoolFilterData,
                fileMetaData
            });
        }

    } catch (e) {
        logger.error(`Error :: ${e}`)
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
});

module.exports = router;