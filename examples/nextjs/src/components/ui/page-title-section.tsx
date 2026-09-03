export function PageTitleSection({
	title,
	description,
}: {
	title: string;
	description: string | React.ReactElement;
}) {
	return (
		<div className="ui-PageTitleSection" data-ui-component="page-title-section">
			<h2 className="ui-PageTitleSectionTitle">{title}</h2>
			<p className="ui-PageTitleSectionDescription">{description}</p>
		</div>
	);
}
