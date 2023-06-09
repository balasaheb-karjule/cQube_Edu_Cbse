const router = require('express').Router();
const { logger } = require('../../../lib/logger');
const auth = require('../../../middleware/check-auth');
const s3File = require('../../../lib/reads3File');
const helper = require('./helper');

router.post('/metaData', auth.authController, async (req, res) => {
    try {
        logger.info(`--- ${req.body.report} meta data api ---`);
        var report = req.body.report;
        let fileName = `${report}/heatChart/metaData.json`;
        let data = await s3File.readFileConfig(fileName);
        let fileMetaData = await s3File.getFileMetaData(fileName);
        data.map(a => {
            a.data['grades'].sort((x, y) => (x.grade) > (y.grade) ? 1 : -1)
            a.data["viewBy"] = [
                { key: "question_id", value: "Question Id" },
                { key: "indicator", value: "Indicator" }
            ]

        })
        logger.info(`--- ${req.body.report} meta data response sent ---`);
        res.status(200).send({ data, fileMetaData });
    } catch (e) {
        logger.error(`Error :: ${e}`)
        res.status(500).json({ errMessage: "Internal error. Please try again!!" });
    }
});

module.exports = router