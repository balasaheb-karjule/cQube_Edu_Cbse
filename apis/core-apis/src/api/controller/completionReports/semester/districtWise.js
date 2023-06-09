const router = require('express').Router();
const { logger } = require('../../../lib/logger');
const auth = require('../../../middleware/check-auth');
const s3File = require('../../../lib/reads3File');

router.post('/allDistrictWise', auth.authController, async (req, res) => {
    try {
        logger.info('--- semester_completion district api ---');
        var sem = req.body.sem;
        var management = req.body.management;
        var category = req.body.category;
        let fileName;
        if (management != 'overall' && category == 'overall') {
            fileName = `exception_list/sat_exception/school_management_category/overall/overall_category/${management_type}/district.json`
        } else {
            fileName = `exception_list/semester_completion/district_sem_completion_${sem}.json`
        }
        let districtData = await s3File.readFileConfig(fileName);
        let fileMetaData = await s3File.getFileMetaData(fileName);
        var sortedData = districtData['data'].sort((a, b) => (a.district_name) > (b.district_name) ? 1 : -1)
        logger.info('--- semester_completion district api response sent ---');
        res.status(200).send({ data: sortedData, footer: districtData.allDistrictsFooter.total_schools_with_missing_data, fileMetaData });
    } catch (e) {
        logger.error(`Error :: ${e}`)
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
});

module.exports = router