import { makeStyles } from "@material-ui/core"
import { useEffect } from "react"
import { useDashboard } from "../../../contexts/dashboard.provider"
const useStyles = makeStyles((theme) => {
	return {
		rootDashboard: {
			[theme.breakpoints.down("xs")]: {},
		},
	}
})
const Transactions = () => {
	const classes = useStyles()
	const { address, getNbTransaction } = useDashboard()

	useEffect(() => {
		const fetch = async () => {
			let trx = await getNbTransaction(address)
			console.log("Transactions.jsx -> 21: trx", trx)
		}

		if (address && address.length > 0) {
			fetch()
		}
	}, [address])

	return (
		<div className={classes.rootTransactions}>
			<h1>Transactions</h1>
		</div>
	)
}

export default Transactions
