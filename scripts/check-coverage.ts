import { readFileSync } from "node:fs";

const [, , coverageFile = "coverage/lcov.info", minimumCoverageArg = "100"] =
	process.argv;

const minimumCoverage = Number(minimumCoverageArg);

if (
	!Number.isFinite(minimumCoverage) ||
	minimumCoverage < 0 ||
	minimumCoverage > 100
) {
	throw new Error(
		`Coverage threshold must be a number between 0 and 100. Received: ${minimumCoverageArg}`,
	);
}

const report = readFileSync(coverageFile, "utf8");

let linesFound = 0;
let linesHit = 0;

for (const line of report.split("\n")) {
	if (line.startsWith("LF:")) {
		linesFound += Number(line.slice(3));
	}

	if (line.startsWith("LH:")) {
		linesHit += Number(line.slice(3));
	}
}

if (linesFound === 0) {
	throw new Error(`No line coverage data found in ${coverageFile}`);
}

const coverage = (linesHit / linesFound) * 100;
const formattedCoverage = coverage.toFixed(2);
const formattedMinimumCoverage = minimumCoverage.toFixed(2);
const summaryFile = process.env.GITHUB_STEP_SUMMARY;

console.log(`Line coverage: ${formattedCoverage}% (${linesHit}/${linesFound})`);

if (summaryFile) {
	const summary = [
		"## カバレッジ概要",
		"",
		`- 行カバレッジ: ${formattedCoverage}% (${linesHit}/${linesFound})`,
		`- 必要しきい値: ${formattedMinimumCoverage}%`,
		"",
	].join("\n");

	await Bun.write(summaryFile, summary, { createPath: true });
}

if (coverage < minimumCoverage) {
	throw new Error(
		`Line coverage ${formattedCoverage}% is below the required ${formattedMinimumCoverage}%`,
	);
}
