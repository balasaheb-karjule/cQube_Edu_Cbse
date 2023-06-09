const router = require('express').Router();
var const_data = require('../../../lib/config');
const { logger } = require('../../../lib/logger');
const auth = require('../../../middleware/check-auth');
const s3File = require('../../../lib/reads3File');

router.post('/allSchoolWise', auth.authController, async (req, res) => {
    try {
        logger.info('---Infra school wise api ---');
        var management = req.body.management;
        var category = req.body.category;
        let fileName;

        if (management != 'overall' && category == 'overall') {
            fileName = `infra/school_management_category/overall_category/${management}/infra_school_map.json`;
        } else {
            fileName = `infra/infra_school_map.json`
        }
        let schoolData = await s3File.readFileConfig(fileName);
        var mydata = schoolData.data;
        let fileMetaData = await s3File.getFileMetaData(fileName);
        logger.info('---Infra school wise api response sent---');
        res.status(200).send({
            data: mydata, footer: schoolData.allSchoolsFooter.totalSchools, fileMetaData
        });
    } catch (e) {
        logger.error(`Error :: ${e}`)
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
});

router.post('/schoolWise/:distId/:blockId/:clusterId', async (req, res) => {
    try {
        logger.info('---Infra schoolPerCluster api ---');
        var management = req.body.management;
        var category = req.body.category;
        let fileName;

        if (management != 'overall' && category == 'overall') {
            fileName = `infra/school_management_category/overall_category/${management}/infra_school_map.json`;
        } else {
            fileName = `infra/infra_school_map.json`
        }
        let schoolData = await s3File.readFileConfig(fileName);

        let clusterId = req.params.clusterId;

        let filterData = schoolData.data.filter(obj => {
            return (parseInt(obj.details.cluster_id) == clusterId)
        })

        let mydata = filterData;
        let fileMetaData = await s3File.getFileMetaData(fileName);
        logger.info('---Infra schoolPerCluster api response sent---');
        res.status(200).send({
            data: mydata, footer: schoolData.footer[`${clusterId}`].totalSchools, fileMetaData
        });

    } catch (e) {
        logger.error(e);
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
})


module.exports = router;