import styles from "./page-title-section.module.css";

export function PageTitleSection({
	title,
	description,
}: {
	title: string;
	description: string | React.ReactElement;
}) {
	return (
		<div className={styles.root}>
			<h2 className={styles.title}>{title}</h2>
			<p className={styles.description}>{description}</p>
		</div>
	);
}
