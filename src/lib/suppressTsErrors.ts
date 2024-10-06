import type { Diagnostic, SourceFile, ts } from "ts-morph";
import { buildComment } from "./buildComment";

const getMessage = (diagnostic: Diagnostic<ts.Diagnostic>) => {
	let errorMessage = diagnostic.getMessageText();
	if (typeof errorMessage !== "string") {
		errorMessage = errorMessage.getMessageText();
	}
	errorMessage = errorMessage.split("\n")[0];

	return errorMessage;
};

export const suppressTsErrors = ({
	sourceFile,
	commentType,
	withErrorCode,
}: {
	sourceFile: SourceFile;
	commentType: CommentType;
	withErrorCode: boolean;
}): {
	text: string;
	count: number;
} => {
	const sourceTextArray = sourceFile.getFullText().split("\n");
	let insertedCommentCount = 0;
	const listOfLineNumberWithErrors: number[] = [];

	for (const d of sourceFile.getPreEmitDiagnostics()) {
		const lineNumber = d.getLineNumber();
		const diagnosticCategory = d.getCategory();

		// Skip not error
		if (lineNumber === undefined || diagnosticCategory !== 1) {
			continue;
		}

		// Skip errors in rows with errors already found
		if (listOfLineNumberWithErrors.includes(lineNumber)) {
			continue;
		}

		// Build comments with indentation matching the error location
		const insertComment = buildComment({
			sourceFile,
			lineNumber,
			commentType: commentType,
			errorCode: d.getCode(),
			withErrorCode: withErrorCode,
			message: getMessage(d),
		});

		// Insert comment
		sourceTextArray.splice(
			lineNumber + insertedCommentCount - 1,
			0,
			insertComment,
		);

		// Increment comment counts
		insertedCommentCount += 1;
		listOfLineNumberWithErrors.push(lineNumber);
	}

	return {
		text: sourceTextArray.join("\n"),
		count: insertedCommentCount,
	};
};
