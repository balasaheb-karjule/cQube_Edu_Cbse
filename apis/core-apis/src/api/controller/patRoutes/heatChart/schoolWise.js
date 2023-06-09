const router = require('express').Router();
const { logger } = require('../../../lib/logger');
const auth = require('../../../middleware/check-auth');
const s3File = require('../../../lib/reads3File');
const helper = require('./helper');

router.post('/schoolWise', auth.authController, async (req, res) => {
    try {
        logger.info(`--- ${req.body.report} heat map school wise api ---`);
        let { year, month, grade, subject_name, exam_date, blockId, clusterId, viewBy, report, management, category } = req.body
        let fileName = '';
        let schoolLevel = req.body.schoolLevel

        if (management != 'overall' && category == 'overall') {
            if (grade == "") {
                fileName = `${report}/school_management_category/heatmap-summary/${year}/${month}/overall_category/${management}/clusters/${blockId}.json`
            } else {
                if (viewBy == 'indicator') {
                    fileName = `${report}/school_management_category/heatChart/indicatorIdLevel/${year}/${month}/overall_category/${management}/clusters/${blockId}.json`;
                } else if (viewBy == 'question_id')
                    fileName = `${report}/school_management_category/heatChart/questionIdLevel/${year}/${month}/overall_category/${management}/clusters/${blockId}.json`;
            }
        } else {
            if (grade == "") {
                fileName = `${report}/heatmap-summary/${year}/${month}/clusters/${blockId}.json`
            } else {
                if (viewBy == 'indicator') {
                    fileName = `${report}/heatChart/indicatorIdLevel/${year}/${month}/clusters/${blockId}.json`;
                } else if (viewBy == 'question_id')
                    fileName = `${report}/heatChart/questionIdLevel/${year}/${month}/clusters/${blockId}.json`;
            }
        }
        
        let data =  await s3File.readFileConfig(fileName);
        
        if (schoolLevel) {
            data = data.filter(id => id.school_id === req.body.schoolId)
        }

        if (clusterId) {
            data = data.filter(val => {
                return (
                    val.cluster_id == clusterId
                )
            })
        }

        let schoolDetails = data.map(e => {
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

        if (grade) {
            data = data.filter(val => {
                return val.grade == grade
            })
        }
        if (subject_name) {
            data = data.filter(val => {
                return val.subject_name == subject_name
            })
        }
        if (exam_date) {
            data = data.filter(val => {
                return val.exam_date == exam_date
            })
        }

        data = data.sort((a, b) => (a.school_name) > (b.school_name) ? 1 : -1)
        let result = await helper.generalFun(grade, data, 3, viewBy)
        let fileMetaData = await s3File.getFileMetaData(fileName);

        logger.info(`--- ${req.body.report} heat map school wise response sent ---`);
        res.status(200).send({ schoolDetails, result, downloadData: data, fileMetaData });
    } catch (e) {
        logger.error(`Error :: ${e}`)
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
});

module.exports = router