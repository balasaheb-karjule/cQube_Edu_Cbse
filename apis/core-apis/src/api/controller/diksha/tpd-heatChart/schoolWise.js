const router = require('express').Router();
const { logger } = require('../../../lib/logger');
const auth = require('../../../middleware/check-auth');
const s3File = require('../../../lib/reads3File');
const helper = require('./helper');

router.post('/schoolWise', auth.authController, async (req, res) => {
    try {
        logger.info('---diksha tpd  school wise api ---');
        let schoolLevel = req.body.schoolLevel
        let { timePeriod, reportType, clusterId, courses } = req.body
        var fileName = `diksha_tpd/school/${timePeriod}.json`;
        let jsonData = await s3File.readFileConfig(fileName);
        let fileMetaData = await s3File.getFileMetaData(fileName);

        if (schoolLevel) {
            jsonData = jsonData.filter(id => id.school_id === req.body.schoolId)
        }

        if (clusterId) {
            jsonData = jsonData.filter(val => {
                return (
                    val.cluster_id == clusterId
                )
            })
        }

        let schoolDetails = jsonData.map(e => {
            return {
                district_id: e.district_id,
                district_name: e.district_name,
                block_id: e.block_id,
                block_name: e.block_name,
                cluster_id: e.cluster_id,
                cluster_name: e.cluster_name,
                school_id: e.school_id,
                school_name: e.school_name
            }
        })

        schoolDetails = schoolDetails.reduce((unique, o) => {
            if (!unique.some(obj => obj.school_id === o.school_id)) {
                unique.push(o);
            }
            return unique;
        }, []);

        if (courses.length > 0) {
            jsonData = jsonData.filter(item => {
                return courses.includes(item['collection_id']);
            });
        }
        jsonData = jsonData.sort((a, b) => (a.school_name) > (b.school_name) ? 1 : -1)
        let result = await helper.generalFun(jsonData, 3, reportType)

        logger.info('--- diksha tpd  school wise response sent ---');
        res.status(200).send({ schoolDetails, result, downloadData: jsonData, fileMetaData });
    } catch (e) {
        logger.error(`Error :: ${e}`)
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
});

module.exports = router