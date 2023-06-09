const router = require('express').Router();
const { logger } = require('../../lib/logger');
const auth = require('../../middleware/check-auth');
const s3File = require('../../lib/reads3File');

router.post('/allClusterWise', auth.authController, async (req, res) => {
    try {
        logger.info('---UDISE cluster wise api ---');
        var management = req.body.management;
        var category = req.body.category;
        let fileName;

        if (management != 'overall' && category == 'overall') {
            fileName = `udise/school_management_category/overall_category/${management}/cluster.json`;
        } else {
            fileName = `udise/udise_cluster_wise.json`
        }
        let clusterData = await s3File.readFileConfig(fileName);
        var mydata = clusterData.data;
        let fileMetaData = await s3File.getFileMetaData(fileName);
        logger.info('---UDISE cluster wise api response sent---');
        res.status(200).send({
            data: mydata, footer: clusterData.allClustersFooter.totalSchools, fileMetaData
        });
    } catch (e) {
        logger.error(`Error :: ${e}`)
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
});

router.post('/clusterWise/:distId/:blockId', auth.authController, async (req, res) => {
    try {
        logger.info('---UDISE clusterperBlock api ---');
        var management = req.body.management;
        var category = req.body.category;
        let fileName;

        if (management != 'overall' && category == 'overall') {
            fileName = `udise/school_management_category/overall_category/${management}/cluster.json`;
        } else {
            fileName = `udise/udise_cluster_wise.json`
        }
        let clusterData = await s3File.readFileConfig(fileName);

        let distId = req.params.distId;
        let blockId = req.params.blockId;

        let filterData = clusterData.data.filter(obj => {
            return (obj.details.district_id == distId && obj.details.block_id == blockId)
        })
        let mydata = filterData;
        let fileMetaData = await s3File.getFileMetaData(fileName);
        logger.info('---UDISE clusterperBlock api response sent---');
        res.status(200).send({
            data: mydata, footer: clusterData.footer[`${blockId}`].totalSchools, fileMetaData
        });


    } catch (e) {
        logger.error(e);
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
})


module.exports = router;